/**
 * Tests for StateManager
 * @module state-manager.test
 */

import { StateManager } from './state-manager.js';
import { WorkflowStep, StepExecution } from './types.js';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('StateManager', () => {
  let stateManager: StateManager;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), 'orchestrator-test-'));
    stateManager = new StateManager(testDir);
    await stateManager.init();
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('create', () => {
    test('creates new workflow state with pending status', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      const state = await stateManager.create('wf-1', steps);

      expect(state.id).toBe('wf-1');
      expect(state.status).toBe('pending');
      expect(state.steps).toEqual(steps);
      expect(state.executions.size).toBe(0);
      expect(state.createdAt).toBeInstanceOf(Date);
      expect(state.updatedAt).toBeInstanceOf(Date);
      expect(state.metadata).toEqual({});
    });

    test('persists workflow to disk', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: { command: 'echo test' } }
      ];

      await stateManager.create('wf-persist', steps);

      const filePath = join(testDir, 'wf-persist.json');
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.id).toBe('wf-persist');
      expect(parsed.status).toBe('pending');
      expect(parsed.steps).toEqual(steps);
    });

    test('can retrieve created workflow', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-retrieve', steps);
      const retrieved = stateManager.get('wf-retrieve');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('wf-retrieve');
      expect(retrieved?.steps).toEqual(steps);
    });
  });

  describe('updateStatus', () => {
    test('updates workflow status and updatedAt timestamp', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-status', steps);
      const initialState = stateManager.get('wf-status');
      const initialUpdatedAt = initialState!.updatedAt;

      // Wait 10ms to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      await stateManager.updateStatus('wf-status', 'running');
      const updatedState = stateManager.get('wf-status');

      expect(updatedState?.status).toBe('running');
      expect(updatedState?.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    test('throws error for non-existent workflow', async () => {
      await expect(
        stateManager.updateStatus('non-existent', 'running')
      ).rejects.toThrow('Workflow non-existent not found');
    });

    test('persists status update to disk', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-persist-status', steps);
      await stateManager.updateStatus('wf-persist-status', 'completed');

      const filePath = join(testDir, 'wf-persist-status.json');
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.status).toBe('completed');
    });
  });

  describe('updateStepExecution', () => {
    test('adds step execution to workflow', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-step-exec', steps);

      const execution: StepExecution = {
        stepId: 'step-1',
        status: 'running',
        startedAt: new Date(),
        attempts: 1
      };

      await stateManager.updateStepExecution('wf-step-exec', execution);
      const state = stateManager.get('wf-step-exec');

      expect(state?.executions.size).toBe(1);
      expect(state?.executions.get('step-1')).toEqual(execution);
    });

    test('updates existing step execution', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-update-exec', steps);

      const initialExecution: StepExecution = {
        stepId: 'step-1',
        status: 'running',
        startedAt: new Date(),
        attempts: 1
      };

      await stateManager.updateStepExecution('wf-update-exec', initialExecution);

      const updatedExecution: StepExecution = {
        stepId: 'step-1',
        status: 'success',
        startedAt: initialExecution.startedAt,
        completedAt: new Date(),
        result: { stdout: 'test output' },
        attempts: 1
      };

      await stateManager.updateStepExecution('wf-update-exec', updatedExecution);
      const state = stateManager.get('wf-update-exec');

      expect(state?.executions.get('step-1')?.status).toBe('success');
      expect(state?.executions.get('step-1')?.result).toEqual({ stdout: 'test output' });
    });

    test('throws error for non-existent workflow', async () => {
      const execution: StepExecution = {
        stepId: 'step-1',
        status: 'running',
        startedAt: new Date(),
        attempts: 1
      };

      await expect(
        stateManager.updateStepExecution('non-existent', execution)
      ).rejects.toThrow('Workflow non-existent not found');
    });

    test('persists execution updates to disk', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-persist-exec', steps);

      const execution: StepExecution = {
        stepId: 'step-1',
        status: 'success',
        startedAt: new Date(),
        completedAt: new Date(),
        result: { data: 'test' },
        attempts: 1
      };

      await stateManager.updateStepExecution('wf-persist-exec', execution);

      const filePath = join(testDir, 'wf-persist-exec.json');
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.executions).toHaveLength(1);
      expect(parsed.executions[0][0]).toBe('step-1');
      expect(parsed.executions[0][1].status).toBe('success');
    });
  });

  describe('get and getAll', () => {
    test('returns undefined for non-existent workflow', () => {
      const state = stateManager.get('non-existent');
      expect(state).toBeUndefined();
    });

    test('getAll returns all workflows', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-1', steps);
      await stateManager.create('wf-2', steps);
      await stateManager.create('wf-3', steps);

      const allWorkflows = stateManager.getAll();

      expect(allWorkflows).toHaveLength(3);
      expect(allWorkflows.map(w => w.id)).toContain('wf-1');
      expect(allWorkflows.map(w => w.id)).toContain('wf-2');
      expect(allWorkflows.map(w => w.id)).toContain('wf-3');
    });

    test('getAll returns empty array when no workflows exist', () => {
      const allWorkflows = stateManager.getAll();
      expect(allWorkflows).toEqual([]);
    });
  });

  describe('loadAll', () => {
    test('loads existing workflows from disk on init', async () => {
      // Create workflows with first state manager
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-load-1', steps);
      await stateManager.create('wf-load-2', steps);

      // Create new state manager with same directory
      const newStateManager = new StateManager(testDir);
      await newStateManager.init();

      const allWorkflows = newStateManager.getAll();
      expect(allWorkflows).toHaveLength(2);
      expect(allWorkflows.map(w => w.id)).toContain('wf-load-1');
      expect(allWorkflows.map(w => w.id)).toContain('wf-load-2');
    });

    test('handles corrupted JSON files gracefully', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-good', steps);

      // Write corrupted JSON file
      const corruptedPath = join(testDir, 'corrupted.json');
      await writeFile(corruptedPath, '{ invalid json }');

      // Create new state manager - should load good file and skip corrupted
      const newStateManager = new StateManager(testDir);
      await newStateManager.init();

      const allWorkflows = newStateManager.getAll();
      expect(allWorkflows).toHaveLength(1);
      expect(allWorkflows[0].id).toBe('wf-good');
    });
  });

  describe('delete', () => {
    test('removes workflow from memory', async () => {
      const steps: WorkflowStep[] = [
        { id: 'step-1', name: 'Test Step', tool: 'exec', params: {} }
      ];

      await stateManager.create('wf-delete', steps);
      expect(stateManager.get('wf-delete')).toBeDefined();

      await stateManager.delete('wf-delete');
      expect(stateManager.get('wf-delete')).toBeUndefined();
    });

    test('delete non-existent workflow does not throw', async () => {
      await expect(
        stateManager.delete('non-existent')
      ).resolves.not.toThrow();
    });
  });
});
