/**
 * Hook Handlers - OpenClaw plugin hooks (Phase 1 MVP)
 * @module hooks
 */

import type {
  OpenClawPluginApi,
  PluginHookSubagentSpawnedEvent,
  PluginHookSubagentContext,
  PluginHookSubagentEndedEvent,
  PluginHookMessageSendingEvent,
  PluginHookMessageContext,
  PluginHookMessageSendingResult,
} from './plugin-types.js';
import { SubagentTracker } from './subagent-tracker.js';

/**
 * Completion message patterns to intercept
 */
const COMPLETION_PATTERNS = [
  /I'?m done/i,
  /task\s+complete/i,
  /finished/i,
  /\[COMPLETED\]/i,
  /work\s+is\s+complete/i,
];

/**
 * Check if a message indicates task completion
 */
function isCompletionMessage(content: string): boolean {
  return COMPLETION_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Register all Phase 1 hooks
 */
export function registerHooks(api: OpenClawPluginApi, tracker: SubagentTracker): void {
  const logger = api.logger;

  /**
   * Hook: subagent_spawned
   * Track when subagents are created
   */
  api.on(
    'subagent_spawned',
    async (event: PluginHookSubagentSpawnedEvent, ctx: PluginHookSubagentContext) => {
      const { childSessionKey, runId, label, agentId } = event;
      const { requesterSessionKey } = ctx;

      if (!requesterSessionKey) {
        logger.warn('[workflow-orchestrator] subagent_spawned: No requesterSessionKey in context', {
          childSessionKey,
          runId,
        });
        return;
      }

      tracker.track(childSessionKey, {
        runId,
        requesterSessionKey,
        startedAt: new Date(),
        label,
        agentId,
      });

      logger.info('[workflow-orchestrator] Tracked subagent', {
        childSessionKey,
        runId,
        label: label || agentId,
        requesterSessionKey,
      });
    },
    { priority: 100 }
  );

  /**
   * Hook: subagent_ended
   * Stop tracking when subagents complete
   */
  api.on(
    'subagent_ended',
    async (event: PluginHookSubagentEndedEvent, _ctx: PluginHookSubagentContext) => {
      const { targetSessionKey, outcome, runId } = event;

      const subagent = tracker.get(targetSessionKey);
      if (!subagent) {
        logger.debug('[workflow-orchestrator] subagent_ended: Not tracked', {
          targetSessionKey,
          outcome,
        });
        return;
      }

      const wasTracked = tracker.untrack(targetSessionKey);
      if (wasTracked) {
        const durationMs = Date.now() - subagent.startedAt.getTime();
        logger.info('[workflow-orchestrator] Subagent ended', {
          targetSessionKey,
          runId,
          outcome,
          label: subagent.label || subagent.agentId,
          durationMs,
          remainingSubagents: tracker.count(),
        });
      }
    },
    { priority: 100 }
  );

  /**
   * Hook: message_sending
   * Block completion messages if subagents are still active
   */
  api.on(
    'message_sending',
    async (
      event: PluginHookMessageSendingEvent,
      _ctx: PluginHookMessageContext
    ): Promise<PluginHookMessageSendingResult | undefined> => {
      const { content, to } = event;

      // Check if this is a completion message
      if (!isCompletionMessage(content)) {
        return undefined; // Allow non-completion messages
      }

      // Check if we can determine the sender's session key from context
      // Note: In Phase 1, we'll use a heuristic approach
      // In Phase 2+, we can enhance this with better session tracking
      
      // For now, check if ANY subagents are active
      // A more sophisticated approach would check if this specific session has subagents
      const activeCount = tracker.count();
      
      if (activeCount > 0) {
        logger.warn('[workflow-orchestrator] Blocked premature completion message', {
          to,
          contentPreview: content.substring(0, 100),
          activeSubagents: activeCount,
        });

        return { cancel: true };
      }

      logger.debug('[workflow-orchestrator] Allowed completion message (no active subagents)', {
        to,
        activeSubagents: 0,
      });

      return undefined; // Allow message
    },
    { priority: 200 }
  );

  logger.info('[workflow-orchestrator] Hooks registered (Phase 1 MVP)');
}
