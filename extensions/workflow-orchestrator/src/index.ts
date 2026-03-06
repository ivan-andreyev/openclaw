/**
 * Workflow Orchestrator Plugin - Main Entry Point
 * @module index
 */

// Export Phase 1 plugin
export { default } from './plugin.js';
export { version } from './plugin.js';

// Export types and utilities for testing
export { SubagentTracker } from './subagent-tracker.js';
export type { TrackedSubagent } from './subagent-tracker.js';
export { registerHooks } from './hooks.js';
export type {
  OpenClawPluginApi,
  PluginLogger,
  PluginHookSubagentSpawnedEvent,
  PluginHookSubagentEndedEvent,
  PluginHookMessageSendingEvent,
  PluginHookSubagentContext,
  PluginHookMessageContext,
  PluginHookMessageSendingResult,
} from './plugin-types.js';
