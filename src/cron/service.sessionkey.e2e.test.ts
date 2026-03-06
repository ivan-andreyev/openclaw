import fs from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CronService } from "./service.js";

describe("cron sessionKey e2e", () => {
  let tmpDir: string;
  let mockEnqueueSystemEvent: ReturnType<typeof vi.fn>;
  let mockRequestHeartbeatNow: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tmpDir = path.join(
      process.env["RUNNER_TEMP"] ?? "/tmp",
      `cron-sessionkey-test-${Date.now()}`,
    );
    await fs.mkdir(tmpDir, { recursive: true });

    mockEnqueueSystemEvent = vi.fn();
    mockRequestHeartbeatNow = vi.fn();
  });

  it("executes job with sessionKey and sends to specific session", async () => {
    const sessionKey = "agent:main:telegram:group:-1001234567:topic:42";
    const storePath = path.join(tmpDir, "jobs.json");

    const cron = new CronService({
      storePath,
      cronEnabled: true,
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      enqueueSystemEvent: mockEnqueueSystemEvent,
      requestHeartbeatNow: mockRequestHeartbeatNow,
      runIsolatedAgentJob: vi.fn(),
    });

    await cron.start();

    // Add a job with sessionKey
    const job = await cron.add({
      name: "Session-specific reminder",
      schedule: {
        kind: "at",
        at: new Date(Date.now() - 1000).toISOString(), // In the past, so it runs immediately
      },
      sessionTarget: "main",
      sessionKey,
      wakeMode: "next-heartbeat",
      payload: {
        kind: "systemEvent",
        text: "Remember to check the logs!",
      },
    });

    expect(job.sessionKey).toBe(sessionKey);
    expect(job.sessionTarget).toBe("main");

    // Force run the job
    const result = await cron.run(job.id, "force");
    expect(result.ok).toBe(true);
    expect(result.ran).toBe(true);

    // Verify enqueueSystemEvent was called with the sessionKey
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith(
      "Remember to check the logs!",
      expect.objectContaining({
        sessionKey,
        contextKey: `cron:${job.id}`,
      }),
    );

    cron.stop();
  });

  it("updates job to add sessionKey", async () => {
    const storePath = path.join(tmpDir, "jobs-update.json");
    const newSessionKey = "agent:main:telegram:user:987654321";

    const cron = new CronService({
      storePath,
      cronEnabled: true,
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      enqueueSystemEvent: mockEnqueueSystemEvent,
      requestHeartbeatNow: mockRequestHeartbeatNow,
      runIsolatedAgentJob: vi.fn(),
    });

    await cron.start();

    // Add a job without sessionKey
    const job = await cron.add({
      name: "Update test job",
      schedule: {
        kind: "cron",
        expr: "0 9 * * *",
      },
      sessionTarget: "main",
      wakeMode: "now",
      payload: {
        kind: "systemEvent",
        text: "Morning reminder",
      },
    });

    expect(job.sessionKey).toBeUndefined();

    // Update to add sessionKey
    const updated = await cron.update(job.id, {
      sessionKey: newSessionKey,
    });

    expect(updated.sessionKey).toBe(newSessionKey);
    expect(updated.id).toBe(job.id);

    // Run the updated job
    await cron.run(updated.id, "force");

    // Verify it now uses the sessionKey
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith(
      "Morning reminder",
      expect.objectContaining({
        sessionKey: newSessionKey,
      }),
    );

    cron.stop();
  });

  it("clears sessionKey when updated to null", async () => {
    const storePath = path.join(tmpDir, "jobs-clear.json");
    const initialSessionKey = "agent:main:telegram:group:-123";

    const cron = new CronService({
      storePath,
      cronEnabled: true,
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      enqueueSystemEvent: mockEnqueueSystemEvent,
      requestHeartbeatNow: mockRequestHeartbeatNow,
      runIsolatedAgentJob: vi.fn(),
    });

    await cron.start();

    // Add a job with sessionKey
    const job = await cron.add({
      name: "Clear test job",
      schedule: {
        kind: "every",
        everyMs: 3600000, // 1 hour
      },
      sessionTarget: "main",
      sessionKey: initialSessionKey,
      wakeMode: "now",
      payload: {
        kind: "systemEvent",
        text: "Hourly check",
      },
    });

    expect(job.sessionKey).toBe(initialSessionKey);

    // Clear sessionKey by updating to null
    const updated = await cron.update(job.id, {
      sessionKey: null,
    });

    expect(updated.sessionKey).toBeUndefined();

    // Run the updated job
    await cron.run(updated.id, "force");

    // Verify sessionKey is now undefined in the call
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith(
      "Hourly check",
      expect.objectContaining({
        sessionKey: undefined,
      }),
    );

    cron.stop();
  });

  it("works with isolated jobs that have sessionKey for summary delivery", async () => {
    const sessionKey = "agent:main:telegram:user:555";
    const storePath = path.join(tmpDir, "jobs-isolated.json");

    const mockRunIsolatedAgentJob = vi.fn().mockResolvedValue({
      status: "ok",
      summary: "Task completed successfully",
      outputText: "Detailed output here",
      sessionId: "isolated-session-123",
      sessionKey: "cron:isolated-job",
      delivered: false, // Not delivered, so summary should be posted to main
    });

    const cron = new CronService({
      storePath,
      cronEnabled: true,
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      enqueueSystemEvent: mockEnqueueSystemEvent,
      requestHeartbeatNow: mockRequestHeartbeatNow,
      runIsolatedAgentJob: mockRunIsolatedAgentJob,
    });

    await cron.start();

    // Add an isolated job with sessionKey and delivery announce
    const job = await cron.add({
      name: "Isolated with sessionKey",
      schedule: {
        kind: "at",
        at: new Date(Date.now() - 1000).toISOString(),
      },
      sessionTarget: "isolated",
      sessionKey,
      wakeMode: "now",
      payload: {
        kind: "agentTurn",
        message: "Analyze logs",
      },
      delivery: {
        mode: "announce",
      },
    });

    expect(job.sessionKey).toBe(sessionKey);

    // Run the job
    await cron.run(job.id, "force");

    // Verify isolated job was executed
    expect(mockRunIsolatedAgentJob).toHaveBeenCalledWith({
      job,
      message: "Analyze logs",
    });

    // Verify summary was posted back to the specified session
    expect(mockEnqueueSystemEvent).toHaveBeenCalledWith(
      "Cron: Task completed successfully",
      expect.objectContaining({
        sessionKey,
        contextKey: `cron:${job.id}`,
      }),
    );

    cron.stop();
  });
});
