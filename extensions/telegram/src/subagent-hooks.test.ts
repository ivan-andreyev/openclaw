import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTelegramSubagentHooks } from "./subagent-hooks.js";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

type MockApi = {
  config: any;
  logger: any;
  hooks: {
    subagent_spawning: any[];
    subagent_delivery_target: any[];
    subagent_ended: any[];
  };
  on: (event: string, handler: any) => void;
};

function createMockPluginApi(config: any = {}): MockApi {
  const hooks: MockApi["hooks"] = {
    subagent_spawning: [],
    subagent_delivery_target: [],
    subagent_ended: [],
  };

  return {
    config: config.config ?? {},
    logger: {
      debug: vi.fn(),
    },
    hooks,
    on(event: string, handler: any) {
      if (event === "subagent_spawning") {
        hooks.subagent_spawning.push(handler);
      } else if (event === "subagent_delivery_target") {
        hooks.subagent_delivery_target.push(handler);
      } else if (event === "subagent_ended") {
        hooks.subagent_ended.push(handler);
      }
    },
  } as unknown as MockApi;
}

describe("Telegram subagent hooks", () => {
  describe("subagent_spawning", () => {
    it("returns ok when threadId and to are present with enabled config", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: "-1001234567890",
          threadId: 42,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toEqual({
        status: "ok",
        threadBindingReady: true,
      });
    });

    it("returns error when threadId is missing", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: "-1001234567890",
          threadId: undefined,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toEqual({
        status: "error",
        error: expect.stringContaining("requires a valid forum topic"),
      });
    });

    it("returns error when to is missing", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: undefined,
          threadId: 42,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toEqual({
        status: "error",
        error: expect.stringContaining("requires a valid forum topic"),
      });
    });

    it("ignores non-Telegram channels", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "discord",
          to: "123456",
          threadId: 789,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toBeUndefined();
    });

    it("returns error when threadBindings.enabled is false", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: false,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: "-1001234567890",
          threadId: 42,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toEqual({
        status: "error",
        error: expect.stringContaining("thread bindings are disabled"),
      });
    });

    it("returns error when spawnSubagentSessions is false", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: false,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: "-1001234567890",
          threadId: 42,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: true,
      });

      expect(result).toEqual({
        status: "error",
        error: expect.stringContaining("thread-bound subagent spawns are disabled"),
      });
    });

    it("returns undefined when threadRequested is false", async () => {
      const mockApi = createMockPluginApi({
        config: {
          channels: {
            telegram: {
              threadBindings: {
                enabled: true,
                spawnSubagentSessions: true,
              },
            },
          },
        },
      });

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_spawning[0];
      const result = await handler({
        requester: {
          channel: "telegram",
          to: "-1001234567890",
          threadId: 42,
        },
        childSessionKey: "agent:main:subagent:test",
        agentId: "main",
        mode: "session",
        threadRequested: false,
      });

      expect(result).toBeUndefined();
    });
  });

  // NOTE: subagent_delivery_target tests removed.
  // Telegram plugin intentionally does NOT register this hook
  // to keep subagent sessions internal (no Telegram delivery).

  describe("subagent_ended", () => {
    it("logs for Telegram channels", () => {
      const mockApi = createMockPluginApi({});

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_ended[0];
      handler({
        targetSessionKey: "agent:main:subagent:test",
        requester: {
          channel: "telegram",
        },
        reason: "completed",
      });

      expect(mockApi.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Telegram subagent ended")
      );
    });

    it("does not log for non-Telegram channels", () => {
      const mockApi = createMockPluginApi({});

      registerTelegramSubagentHooks(mockApi as unknown as OpenClawPluginApi);

      const handler = mockApi.hooks.subagent_ended[0];
      handler({
        targetSessionKey: "agent:main:subagent:test",
        requester: {
          channel: "discord",
        },
        reason: "completed",
      });

      expect(mockApi.logger.debug).not.toHaveBeenCalled();
    });
  });
});
