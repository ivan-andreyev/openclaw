import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

function summarizeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "error";
}

export function registerTelegramSubagentHooks(api: OpenClawPluginApi) {
  const resolveThreadBindingFlags = () => {
    // Use session-level threadBindings config (no Telegram-specific override)
    return {
      enabled: api.config.session?.threadBindings?.enabled ?? true,
      // Always allow spawning subagent sessions for Telegram forum topics
      spawnSubagentSessions: true,
    };
  };

  api.on("subagent_spawning", async (event) => {
    // Only handle when thread is requested
    if (!event.threadRequested) {
      return;
    }

    const channel = event.requester?.channel?.trim().toLowerCase();
    if (channel !== "telegram") {
      // Let other plugins handle their own channels
      return;
    }

    const flags = resolveThreadBindingFlags();

    if (!flags.enabled) {
      return {
        status: "error" as const,
        error:
          "Thread bindings are disabled (set session.threadBindings.enabled=true to enable).",
      };
    }

    // Validate thread context exists
    const threadId = event.requester?.threadId;
    const to = event.requester?.to;

    if (!threadId || !to) {
      return {
        status: "error" as const,
        error:
          "Telegram subagent spawn requires a valid forum topic (threadId). Ensure you're calling this from within a forum topic.",
      };
    }

    try {
      // Telegram threads (forum topics) already exist - no need to create them like Discord
      // Just validate we have the required context
      api.logger.debug?.(
        `Telegram subagent thread binding ready: session=${event.childSessionKey} threadId=${threadId} to=${to}`
      );

      return {
        status: "ok" as const,
        threadBindingReady: true,
      };
    } catch (err) {
      return {
        status: "error" as const,
        error: `Telegram thread bind failed: ${summarizeError(err)}`,
      };
    }
  });

  // NOTE: subagent_delivery_target hook intentionally NOT registered.
  // This keeps subagent sessions internal (no Telegram delivery).
  // Main agent reads history via sessions_history and relays to user.

  api.on("subagent_ended", (event) => {
    // Telegram doesn't need cleanup - threads (forum topics) persist
    // Optional: log for debugging
    if (event.requester?.channel?.trim().toLowerCase() === "telegram") {
      api.logger.debug?.(
        `Telegram subagent ended: ${event.targetSessionKey} (${event.reason ?? "normal"})`
      );
    }
  });
}
