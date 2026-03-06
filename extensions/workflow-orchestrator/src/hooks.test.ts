/**
 * Hook Handler Tests
 */

import { registerHooks } from './hooks';
import { SubagentTracker } from './subagent-tracker';
import type {
  OpenClawPluginApi,
  PluginLogger,
  PluginHookSubagentSpawnedEvent,
  PluginHookSubagentEndedEvent,
  PluginHookMessageSendingEvent,
  PluginHookSubagentContext,
  PluginHookMessageContext,
} from './plugin-types';

describe('Hook Handlers', () => {
  let tracker: SubagentTracker;
  let mockLogger: PluginLogger;
  let mockApi: OpenClawPluginApi;
  let registeredHooks: Map<string, (event: any, ctx: any) => Promise<any>>;

  beforeEach(() => {
    tracker = new SubagentTracker();
    registeredHooks = new Map();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockApi = {
      logger: mockLogger,
      on: jest.fn((hookName, handler, opts) => {
        registeredHooks.set(hookName, handler);
      }),
    };

    registerHooks(mockApi, tracker);
  });

  describe('registerHooks()', () => {
    it('should register all required hooks', () => {
      expect(mockApi.on).toHaveBeenCalledTimes(3);
      expect(mockApi.on).toHaveBeenCalledWith(
        'subagent_spawned',
        expect.any(Function),
        { priority: 100 }
      );
      expect(mockApi.on).toHaveBeenCalledWith(
        'subagent_ended',
        expect.any(Function),
        { priority: 100 }
      );
      expect(mockApi.on).toHaveBeenCalledWith(
        'message_sending',
        expect.any(Function),
        { priority: 200 }
      );
    });

    it('should log registration complete', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Hooks registered')
      );
    });
  });

  describe('subagent_spawned hook', () => {
    let handler: (event: PluginHookSubagentSpawnedEvent, ctx: PluginHookSubagentContext) => Promise<void>;

    beforeEach(() => {
      handler = registeredHooks.get('subagent_spawned')!;
    });

    it('should track subagent on spawn', async () => {
      const event: PluginHookSubagentSpawnedEvent = {
        runId: 'run-123',
        childSessionKey: 'agent:sub:1',
        agentId: 'test-agent',
        label: 'Test Subagent',
        mode: 'run',
        threadRequested: false,
      };

      const ctx: PluginHookSubagentContext = {
        requesterSessionKey: 'agent:main',
      };

      await handler(event, ctx);

      const tracked = tracker.get('agent:sub:1');
      expect(tracked).toBeDefined();
      expect(tracked?.runId).toBe('run-123');
      expect(tracked?.requesterSessionKey).toBe('agent:main');
      expect(tracked?.label).toBe('Test Subagent');
      expect(tracked?.agentId).toBe('test-agent');
    });

    it('should log warning if requesterSessionKey is missing', async () => {
      const event: PluginHookSubagentSpawnedEvent = {
        runId: 'run-123',
        childSessionKey: 'agent:sub:1',
        agentId: 'test-agent',
        mode: 'run',
        threadRequested: false,
      };

      const ctx: PluginHookSubagentContext = {};

      await handler(event, ctx);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No requesterSessionKey'),
        expect.any(Object)
      );
      expect(tracker.get('agent:sub:1')).toBeUndefined();
    });

    it('should log subagent tracking', async () => {
      const event: PluginHookSubagentSpawnedEvent = {
        runId: 'run-123',
        childSessionKey: 'agent:sub:1',
        agentId: 'test-agent',
        mode: 'run',
        threadRequested: false,
      };

      const ctx: PluginHookSubagentContext = {
        requesterSessionKey: 'agent:main',
      };

      await handler(event, ctx);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Tracked subagent'),
        expect.objectContaining({
          childSessionKey: 'agent:sub:1',
          runId: 'run-123',
        })
      );
    });
  });

  describe('subagent_ended hook', () => {
    let handler: (event: PluginHookSubagentEndedEvent, ctx: PluginHookSubagentContext) => Promise<void>;

    beforeEach(() => {
      handler = registeredHooks.get('subagent_ended')!;
    });

    it('should untrack subagent on end', async () => {
      // First track a subagent
      tracker.track('agent:sub:1', {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
        label: 'Test Subagent',
      });

      const event: PluginHookSubagentEndedEvent = {
        targetSessionKey: 'agent:sub:1',
        targetKind: 'agent',
        reason: 'completed',
        outcome: 'ok',
        runId: 'run-123',
      };

      const ctx: PluginHookSubagentContext = {};

      await handler(event, ctx);

      expect(tracker.get('agent:sub:1')).toBeUndefined();
      expect(tracker.count()).toBe(0);
    });

    it('should log subagent end with duration', async () => {
      const startTime = new Date(Date.now() - 5000); // 5 seconds ago
      tracker.track('agent:sub:1', {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: startTime,
      });

      const event: PluginHookSubagentEndedEvent = {
        targetSessionKey: 'agent:sub:1',
        targetKind: 'agent',
        reason: 'completed',
        outcome: 'ok',
      };

      await handler(event, {});

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Subagent ended'),
        expect.objectContaining({
          targetSessionKey: 'agent:sub:1',
          outcome: 'ok',
          durationMs: expect.any(Number),
        })
      );
    });

    it('should handle untracked subagent gracefully', async () => {
      const event: PluginHookSubagentEndedEvent = {
        targetSessionKey: 'agent:sub:999',
        targetKind: 'agent',
        reason: 'completed',
      };

      await handler(event, {});

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Not tracked'),
        expect.any(Object)
      );
    });
  });

  describe('message_sending hook', () => {
    let handler: (
      event: PluginHookMessageSendingEvent,
      ctx: PluginHookMessageContext
    ) => Promise<any>;

    beforeEach(() => {
      handler = registeredHooks.get('message_sending')!;
    });

    it('should allow non-completion messages', async () => {
      const event: PluginHookMessageSendingEvent = {
        to: 'user-123',
        content: 'Working on the task...',
      };

      const result = await handler(event, {});
      expect(result).toBeUndefined();
    });

    it('should block completion messages when subagents are active', async () => {
      // Track a subagent
      tracker.track('agent:sub:1', {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      const event: PluginHookMessageSendingEvent = {
        to: 'user-123',
        content: "I'm done with the task!",
      };

      const result = await handler(event, {});

      expect(result).toEqual({ cancel: true });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Blocked premature'),
        expect.any(Object)
      );
    });

    it('should allow completion messages when no subagents are active', async () => {
      const event: PluginHookMessageSendingEvent = {
        to: 'user-123',
        content: "I'm done with the task!",
      };

      const result = await handler(event, {});

      expect(result).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Allowed completion message'),
        expect.any(Object)
      );
    });

    it('should detect various completion patterns', async () => {
      tracker.track('agent:sub:1', {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      const completionMessages = [
        "I'm done",
        'Task complete',
        'Work finished',
        '[COMPLETED] All steps done',
        'The work is complete!',
      ];

      for (const content of completionMessages) {
        const event: PluginHookMessageSendingEvent = {
          to: 'user-123',
          content,
        };

        const result = await handler(event, {});
        expect(result).toEqual({ cancel: true });
      }
    });
  });
});
