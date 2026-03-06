/**
 * OpenClaw Plugin API Type Definitions (subset for Phase 1)
 * @module plugin-types
 * 
 * Note: These types mirror the actual OpenClaw plugin API.
 * For the full API, see openclaw/src/plugins/types.ts
 */

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Subagent spawned event
 */
export interface PluginHookSubagentSpawnedEvent {
  runId: string;
  childSessionKey: string;
  agentId: string;
  label?: string;
  mode: 'run' | 'session';
  requester?: {
    channel?: string;
    accountId?: string;
    to?: string;
    threadId?: string | number;
  };
  threadRequested: boolean;
}

/**
 * Subagent ended event
 */
export interface PluginHookSubagentEndedEvent {
  targetSessionKey: string;
  targetKind: 'agent' | 'user';
  reason: string;
  sendFarewell?: boolean;
  accountId?: string;
  runId?: string;
  endedAt?: number;
  outcome?: 'ok' | 'error' | 'timeout' | 'killed' | 'reset' | 'deleted';
  error?: string;
}

/**
 * Subagent hook context
 */
export interface PluginHookSubagentContext {
  runId?: string;
  childSessionKey?: string;
  requesterSessionKey?: string;
}

/**
 * Message sending event
 */
export interface PluginHookMessageSendingEvent {
  to: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message sending result
 */
export interface PluginHookMessageSendingResult {
  content?: string;  // Replace message content
  cancel?: boolean;  // Block delivery
}

/**
 * Message hook context
 */
export interface PluginHookMessageContext {
  channelId?: string;
  accountId?: string;
  threadId?: string | number;
}

/**
 * Hook names
 */
export type PluginHookName = 
  | 'subagent_spawned'
  | 'subagent_ended'
  | 'message_sending';

/**
 * Hook handler map
 */
export interface PluginHookHandlerMap {
  subagent_spawned: (
    event: PluginHookSubagentSpawnedEvent,
    ctx: PluginHookSubagentContext
  ) => Promise<void>;
  subagent_ended: (
    event: PluginHookSubagentEndedEvent,
    ctx: PluginHookSubagentContext
  ) => Promise<void>;
  message_sending: (
    event: PluginHookMessageSendingEvent,
    ctx: PluginHookMessageContext
  ) => Promise<PluginHookMessageSendingResult | undefined>;
}

/**
 * Hook registration options
 */
export interface PluginHookOptions {
  priority?: number;
}

/**
 * OpenClaw Plugin API (Phase 1 subset)
 */
export interface OpenClawPluginApi {
  logger: PluginLogger;
  
  on: <K extends PluginHookName>(
    hookName: K,
    handler: PluginHookHandlerMap[K],
    opts?: PluginHookOptions
  ) => void;
}

/**
 * Plugin initialization function
 */
export type OpenClawPlugin = (api: OpenClawPluginApi) => void | Promise<void>;
