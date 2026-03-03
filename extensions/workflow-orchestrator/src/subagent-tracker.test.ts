/**
 * SubagentTracker Tests
 */

import { SubagentTracker, TrackedSubagent } from './subagent-tracker';

describe('SubagentTracker', () => {
  let tracker: SubagentTracker;

  beforeEach(() => {
    tracker = new SubagentTracker();
  });

  describe('track()', () => {
    it('should track a new subagent', () => {
      const data: TrackedSubagent = {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
        label: 'test-agent',
      };

      tracker.track('agent:sub:1', data);

      expect(tracker.get('agent:sub:1')).toEqual(data);
      expect(tracker.count()).toBe(1);
    });

    it('should update existing subagent if tracked again', () => {
      const data1: TrackedSubagent = {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      };

      const data2: TrackedSubagent = {
        runId: 'run-456',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
        label: 'updated',
      };

      tracker.track('agent:sub:1', data1);
      tracker.track('agent:sub:1', data2);

      expect(tracker.get('agent:sub:1')).toEqual(data2);
      expect(tracker.count()).toBe(1);
    });
  });

  describe('untrack()', () => {
    it('should remove tracked subagent', () => {
      const data: TrackedSubagent = {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      };

      tracker.track('agent:sub:1', data);
      const result = tracker.untrack('agent:sub:1');

      expect(result).toBe(true);
      expect(tracker.get('agent:sub:1')).toBeUndefined();
      expect(tracker.count()).toBe(0);
    });

    it('should return false if subagent was not tracked', () => {
      const result = tracker.untrack('agent:sub:999');
      expect(result).toBe(false);
    });
  });

  describe('get()', () => {
    it('should return undefined for non-existent subagent', () => {
      expect(tracker.get('agent:sub:999')).toBeUndefined();
    });

    it('should return tracked subagent data', () => {
      const data: TrackedSubagent = {
        runId: 'run-123',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      };

      tracker.track('agent:sub:1', data);
      expect(tracker.get('agent:sub:1')).toEqual(data);
    });
  });

  describe('getByRequester()', () => {
    it('should return all subagents for a requester', () => {
      const requester1 = 'agent:main:1';
      const requester2 = 'agent:main:2';

      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: requester1,
        startedAt: new Date(),
      });

      tracker.track('agent:sub:2', {
        runId: 'run-2',
        requesterSessionKey: requester1,
        startedAt: new Date(),
      });

      tracker.track('agent:sub:3', {
        runId: 'run-3',
        requesterSessionKey: requester2,
        startedAt: new Date(),
      });

      const subagents = tracker.getByRequester(requester1);
      expect(subagents).toHaveLength(2);
      expect(subagents.every(s => s.requesterSessionKey === requester1)).toBe(true);
    });

    it('should return empty array if no subagents for requester', () => {
      const subagents = tracker.getByRequester('agent:main:999');
      expect(subagents).toEqual([]);
    });
  });

  describe('hasActiveSubagents()', () => {
    it('should return true if requester has active subagents', () => {
      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      expect(tracker.hasActiveSubagents('agent:main')).toBe(true);
    });

    it('should return false if requester has no active subagents', () => {
      expect(tracker.hasActiveSubagents('agent:main')).toBe(false);
    });
  });

  describe('getAll()', () => {
    it('should return all tracked subagents', () => {
      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      tracker.track('agent:sub:2', {
        runId: 'run-2',
        requesterSessionKey: 'agent:other',
        startedAt: new Date(),
      });

      const all = tracker.getAll();
      expect(all.size).toBe(2);
      expect(all.has('agent:sub:1')).toBe(true);
      expect(all.has('agent:sub:2')).toBe(true);
    });

    it('should return a copy of the map', () => {
      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      const all = tracker.getAll();
      all.clear();

      expect(tracker.count()).toBe(1); // Original should be unchanged
    });
  });

  describe('clear()', () => {
    it('should remove all tracked subagents', () => {
      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      tracker.track('agent:sub:2', {
        runId: 'run-2',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      tracker.clear();

      expect(tracker.count()).toBe(0);
      expect(tracker.getAll().size).toBe(0);
    });
  });

  describe('count()', () => {
    it('should return 0 when no subagents tracked', () => {
      expect(tracker.count()).toBe(0);
    });

    it('should return correct count', () => {
      tracker.track('agent:sub:1', {
        runId: 'run-1',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      tracker.track('agent:sub:2', {
        runId: 'run-2',
        requesterSessionKey: 'agent:main',
        startedAt: new Date(),
      });

      expect(tracker.count()).toBe(2);

      tracker.untrack('agent:sub:1');
      expect(tracker.count()).toBe(1);
    });
  });
});
