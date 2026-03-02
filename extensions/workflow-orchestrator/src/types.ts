/**
 * Core types for Workflow Orchestrator
 * @module types
 */

/**
 * Overall workflow execution status
 */
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

/**
 * Individual step execution status
 */
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

/**
 * Defines a single workflow step
 */
export interface WorkflowStep {
  /** Unique step identifier */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Tool to execute (e.g., 'exec', 'read', 'write') */
  tool: string;
  /** Tool-specific parameters */
  params: Record<string, unknown>;
  /** Step IDs this step depends on */
  dependsOn?: string[];
  /** Number of retry attempts (overrides default) */
  retryCount?: number;
}

/**
 * Tracks execution state of a single step
 */
export interface StepExecution {
  /** Reference to the step ID */
  stepId: string;
  /** Current execution status */
  status: StepStatus;
  /** When execution started */
  startedAt?: Date;
  /** When execution completed (success or failure) */
  completedAt?: Date;
  /** Result data from successful execution */
  result?: unknown;
  /** Error message if execution failed */
  error?: string;
  /** Number of execution attempts */
  attempts: number;
}

/**
 * Complete workflow state
 */
export interface WorkflowState {
  /** Unique workflow identifier */
  id: string;
  /** Overall workflow status */
  status: WorkflowStatus;
  /** All workflow steps */
  steps: WorkflowStep[];
  /** Execution state for each step */
  executions: Map<string, StepExecution>;
  /** Workflow creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}
