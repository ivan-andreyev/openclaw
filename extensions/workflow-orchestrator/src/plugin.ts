/**
 * Workflow Orchestrator Plugin - Phase 1 MVP
 * @module plugin
 * 
 * **Purpose:** Prevent agents from reporting "I'm done" prematurely when subagents are still active.
 * 
 * **Phase 1 Scope:**
 * - Track subagent spawns/ends via hooks
 * - Block completion messages if subagents are active
 * - No automatic session wake (manual intervention needed)
 * 
 * **Phase 2+ (Future):**
 * - Automatic session wake on subagent completion
 * - DoD (Definition of Done) validation
 * - State persistence
 */

import type { OpenClawPluginApi } from './plugin-types.js';
import { SubagentTracker } from './subagent-tracker.js';
import { registerHooks } from './hooks.js';

/**
 * Plugin version
 */
export const version = '0.1.0-phase1';

/**
 * Plugin initialization
 * 
 * This function is called by OpenClaw when the plugin is loaded.
 * 
 * @param api - OpenClaw plugin API
 */
export default function workflowOrchestratorPlugin(api: OpenClawPluginApi): void {
  const logger = api.logger;

  logger.info(`[workflow-orchestrator] Initializing v${version} (Phase 1 MVP)`);

  // Create subagent tracker
  const tracker = new SubagentTracker();

  // Register hooks
  registerHooks(api, tracker);

  logger.info('[workflow-orchestrator] Initialization complete', {
    version,
    phase: 1,
    features: ['subagent-tracking', 'message-interception'],
    limitations: ['no-auto-wake', 'no-dod-validation', 'no-persistence'],
  });
}
