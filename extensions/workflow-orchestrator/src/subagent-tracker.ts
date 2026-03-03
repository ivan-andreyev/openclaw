/**
 * SubagentTracker - Tracks active subagents (Phase 1 MVP)
 * @module subagent-tracker
 */

/**
 * Tracked subagent information
 */
export interface TrackedSubagent {
  runId: string;
  requesterSessionKey: string;
  startedAt: Date;
  label?: string;
  agentId?: string;
}

/**
 * Simple in-memory tracker for active subagents
 */
export class SubagentTracker {
  private subagents = new Map<string, TrackedSubagent>();

  /**
   * Track a new subagent
   * @param childSessionKey Subagent session key
   * @param data Subagent metadata
   */
  track(childSessionKey: string, data: TrackedSubagent): void {
    this.subagents.set(childSessionKey, data);
  }

  /**
   * Remove a subagent from tracking
   * @param childSessionKey Subagent session key
   * @returns True if subagent was tracked
   */
  untrack(childSessionKey: string): boolean {
    return this.subagents.delete(childSessionKey);
  }

  /**
   * Get tracked subagent info
   * @param childSessionKey Subagent session key
   */
  get(childSessionKey: string): TrackedSubagent | undefined {
    return this.subagents.get(childSessionKey);
  }

  /**
   * Get all subagents for a specific requester session
   * @param requesterSessionKey Requester session key
   */
  getByRequester(requesterSessionKey: string): TrackedSubagent[] {
    return Array.from(this.subagents.values())
      .filter(s => s.requesterSessionKey === requesterSessionKey);
  }

  /**
   * Check if a requester has any active subagents
   * @param requesterSessionKey Requester session key
   */
  hasActiveSubagents(requesterSessionKey: string): boolean {
    return this.getByRequester(requesterSessionKey).length > 0;
  }

  /**
   * Get all tracked subagents
   */
  getAll(): Map<string, TrackedSubagent> {
    return new Map(this.subagents);
  }

  /**
   * Clear all tracked subagents
   */
  clear(): void {
    this.subagents.clear();
  }

  /**
   * Get total count of tracked subagents
   */
  count(): number {
    return this.subagents.size;
  }
}
