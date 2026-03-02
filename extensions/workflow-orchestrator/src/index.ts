/**
 * Workflow Orchestrator - Main Entry Point
 * @module index
 */

export { StateManager } from './state-manager.js';
export type {
  WorkflowState,
  WorkflowStatus,
  WorkflowStep,
  StepExecution,
  StepStatus
} from './types.js';

/**
 * Workflow Orchestrator version
 */
export const version = '0.1.0';

/**
 * Initialize the orchestrator
 * This is a placeholder for future initialization logic
 */
export function init(): void {
  console.log('[Orchestrator] Initialized v' + version);
}
