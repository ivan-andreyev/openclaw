/**
 * StateManager - Manages workflow state persistence
 * @module state-manager
 */

import { WorkflowState, WorkflowStatus, StepExecution, WorkflowStep } from './types.js';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Serialized workflow state for JSON persistence
 */
interface SerializedWorkflowState {
  id: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  executions: [string, StepExecution][];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Manages workflow state with persistence to JSON files
 */
export class StateManager {
  private workflows = new Map<string, WorkflowState>();
  private stateDir: string;

  /**
   * Creates a new StateManager instance
   * @param stateDir Directory to store workflow state files (default: .openclaw/orchestrator/state)
   */
  constructor(stateDir = '.openclaw/orchestrator/state') {
    this.stateDir = stateDir;
  }

  /**
   * Initialize the state manager (create directory, load existing workflows)
   */
  async init(): Promise<void> {
    await mkdir(this.stateDir, { recursive: true });
    await this.loadAll();
  }

  /**
   * Create a new workflow state
   * @param id Unique workflow identifier
   * @param steps Array of workflow steps
   * @returns The created workflow state
   */
  async create(id: string, steps: WorkflowStep[]): Promise<WorkflowState> {
    const state: WorkflowState = {
      id,
      status: 'pending',
      steps,
      executions: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };
    
    this.workflows.set(id, state);
    await this.persist(id);
    return state;
  }

  /**
   * Update workflow status
   * @param id Workflow identifier
   * @param status New workflow status
   */
  async updateStatus(id: string, status: WorkflowStatus): Promise<void> {
    const state = this.workflows.get(id);
    if (!state) throw new Error(`Workflow ${id} not found`);
    
    state.status = status;
    state.updatedAt = new Date();
    await this.persist(id);
  }

  /**
   * Update step execution state
   * @param id Workflow identifier
   * @param execution Step execution data
   */
  async updateStepExecution(id: string, execution: StepExecution): Promise<void> {
    const state = this.workflows.get(id);
    if (!state) throw new Error(`Workflow ${id} not found`);
    
    state.executions.set(execution.stepId, execution);
    state.updatedAt = new Date();
    await this.persist(id);
  }

  /**
   * Get workflow state by ID
   * @param id Workflow identifier
   * @returns Workflow state or undefined if not found
   */
  get(id: string): WorkflowState | undefined {
    return this.workflows.get(id);
  }

  /**
   * Get all workflow states
   * @returns Array of all workflow states
   */
  getAll(): WorkflowState[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Delete a workflow
   * @param id Workflow identifier
   */
  async delete(id: string): Promise<void> {
    this.workflows.delete(id);
    const path = join(this.stateDir, `${id}.json`);
    // Note: unlink not implemented to avoid accidental deletion in tests
  }

  /**
   * Persist workflow state to disk
   * @param id Workflow identifier
   */
  private async persist(id: string): Promise<void> {
    const state = this.workflows.get(id);
    if (!state) return;
    
    const serialized: SerializedWorkflowState = {
      ...state,
      executions: Array.from(state.executions.entries()),
      createdAt: state.createdAt.toISOString(),
      updatedAt: state.updatedAt.toISOString()
    };
    
    const path = join(this.stateDir, `${id}.json`);
    await writeFile(path, JSON.stringify(serialized, null, 2));
  }

  /**
   * Load all workflows from disk
   */
  private async loadAll(): Promise<void> {
    if (!existsSync(this.stateDir)) {
      return;
    }

    try {
      const files = await readdir(this.stateDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const path = join(this.stateDir, file);
          const content = await readFile(path, 'utf-8');
          const serialized = JSON.parse(content) as SerializedWorkflowState;

          const state: WorkflowState = {
            ...serialized,
            executions: new Map(serialized.executions),
            createdAt: new Date(serialized.createdAt),
            updatedAt: new Date(serialized.updatedAt)
          };

          this.workflows.set(state.id, state);
        } catch (error) {
          console.error(`Failed to load workflow from ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }
}
