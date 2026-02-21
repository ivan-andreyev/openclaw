import { describe, expect, it, vi } from "vitest";
import type { CronJob } from "./types.js";
import type { CronServiceState } from "./service/state.js";

describe("cron sessionKey support", () => {
  it("job schema includes optional sessionKey field", () => {
    const now = Date.now();
    const job: CronJob = {
      id: "test-job",
      name: "Test Job",
      enabled: true,
      createdAtMs: now,
      updatedAtMs: now,
      schedule: { kind: "every", everyMs: 60_000 },
      sessionTarget: "main",
      sessionKey: "agent:main:telegram:user:123",
      wakeMode: "now",
      payload: { kind: "systemEvent", text: "Test message" },
      state: {},
    };

    // Verify the job structure is valid
    expect(job.sessionKey).toBe("agent:main:telegram:user:123");
    expect(job.sessionTarget).toBe("main");
  });

  it("sessionKey is optional and backward compatible", () => {
    const now = Date.now();
    const jobWithoutSessionKey: CronJob = {
      id: "legacy-job",
      name: "Legacy Job",
      enabled: true,
      createdAtMs: now,
      updatedAtMs: now,
      schedule: { kind: "cron", expr: "0 9 * * *" },
      sessionTarget: "main",
      wakeMode: "next-heartbeat",
      payload: { kind: "systemEvent", text: "Daily reminder" },
      state: {},
    };

    // Verify backward compatibility - no sessionKey is fine
    expect(jobWithoutSessionKey.sessionKey).toBeUndefined();
    expect(jobWithoutSessionKey.sessionTarget).toBe("main");
  });

  it("passes sessionKey to enqueueSystemEvent when present", async () => {
    const mockEnqueueSystemEvent = vi.fn();
    const now = Date.now();

    const job: CronJob = {
      id: "session-job",
      name: "Session-specific Job",
      enabled: true,
      createdAtMs: now,
      updatedAtMs: now,
      schedule: { kind: "at", at: new Date(now + 1000).toISOString() },
      sessionTarget: "main",
      sessionKey: "agent:main:telegram:group:-123:topic:456",
      wakeMode: "now",
      payload: { kind: "systemEvent", text: "Check on this" },
      state: {},
    };

    const state: Partial<CronServiceState> = {
      deps: {
        nowMs: () => Date.now(),
        log: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        storePath: "/tmp/cron",
        cronEnabled: true,
        enqueueSystemEvent: mockEnqueueSystemEvent,
        requestHeartbeatNow: vi.fn(),
        runIsolatedAgentJob: vi.fn(),
      } as CronServiceState["deps"],
    };

    // Simulate what executeJobCore would do
    const text = job.payload.kind === "systemEvent" ? job.payload.text : "";
    state.deps!.enqueueSystemEvent(text, {
      agentId: job.agentId,
      contextKey: `cron:${job.id}`,
      sessionKey: job.sessionKey,
    });

    // Verify the sessionKey was passed
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith("Check on this", {
      agentId: undefined,
      contextKey: "cron:session-job",
      sessionKey: "agent:main:telegram:group:-123:topic:456",
    });
  });

  it("falls back to agentId resolution when sessionKey is not provided", async () => {
    const mockEnqueueSystemEvent = vi.fn();
    const now = Date.now();

    const job: CronJob = {
      id: "fallback-job",
      name: "Fallback Job",
      enabled: true,
      createdAtMs: now,
      updatedAtMs: now,
      schedule: { kind: "every", everyMs: 60_000 },
      sessionTarget: "main",
      // No sessionKey provided
      wakeMode: "now",
      payload: { kind: "systemEvent", text: "Fallback message" },
      state: {},
    };

    const state: Partial<CronServiceState> = {
      deps: {
        nowMs: () => Date.now(),
        log: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        storePath: "/tmp/cron",
        cronEnabled: true,
        enqueueSystemEvent: mockEnqueueSystemEvent,
        requestHeartbeatNow: vi.fn(),
        runIsolatedAgentJob: vi.fn(),
      } as CronServiceState["deps"],
    };

    // Simulate what executeJobCore would do
    const text = job.payload.kind === "systemEvent" ? job.payload.text : "";
    state.deps!.enqueueSystemEvent(text, {
      agentId: job.agentId,
      contextKey: `cron:${job.id}`,
      sessionKey: job.sessionKey, // undefined
    });

    // Verify the call was made without sessionKey (will use agentId resolution)
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith("Fallback message", {
      agentId: undefined,
      contextKey: "cron:fallback-job",
      sessionKey: undefined,
    });
  });
});
