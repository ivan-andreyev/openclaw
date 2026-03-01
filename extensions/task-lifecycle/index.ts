import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export default function register(api: OpenClawPluginApi) {
  api.logger.info("[task-lifecycle] Plugin registering...");

  // Use api.on() instead of api.registerHook()
  api.on("subagent_spawned", async (event, context) => {
    api.logger.info(`[task-lifecycle] ✅ HOOK FIRED! runId: ${event.runId.substring(0, 20)}`);
    api.logger.info(`[task-lifecycle] Label: ${event.label}`);
    api.logger.info(`[task-lifecycle] AgentId: ${event.agentId}`);
    api.logger.info(`[task-lifecycle] Mode: ${event.mode}`);
    api.logger.info(`[task-lifecycle] ChildSessionKey: ${event.childSessionKey.substring(0, 30)}...`);
    api.logger.info(`[task-lifecycle] RequesterSessionKey: ${context.requesterSessionKey?.substring(0, 30)}...`);
    
    // Extract task ID from label (e.g., "TASK-123: description" -> "TASK-123")
    const taskId = event.label?.split(':')[0]?.trim();
    if (taskId) {
      api.logger.info(`[task-lifecycle] Extracted taskId: ${taskId}`);
    }
    
    // Test bridge connectivity
    try {
      const response = await fetch("http://127.0.0.1:9876/health");
      const data = await response.json();
      api.logger.info(`[task-lifecycle] Bridge: ${JSON.stringify(data)}`);
    } catch (err) {
      api.logger.error(`[task-lifecycle] Bridge error: ${err}`);
    }
  });

  api.on("subagent_ended", async (event, context) => {
    api.logger.info(`[task-lifecycle] ✅ ENDED HOOK! targetSessionKey: ${event.targetSessionKey.substring(0, 20)}`);
  });

  api.logger.info("[task-lifecycle] Hooks registered via api.on()");
}
