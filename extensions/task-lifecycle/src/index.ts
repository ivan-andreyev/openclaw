// Helper: Extract taskId from label (e.g., "TASK-123-456: description" -> "TASK-123-456")
function extractTaskId(label: string | undefined): string | null {
  if (!label) return null;
  
  const match = label.match(/^(TASK-\d+-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

export default function register(api: any) {
  api.logger.info("[task-lifecycle] ✅ Plugin loading with AUTO-VALIDATION");

  // Hook: SubAgent spawned
  api.on("subagent_spawned", async (event: any, context: any) => {
    // VALIDATION: Check for label
    if (!event.label) {
      api.logger.warn(`[task-lifecycle] ⚠️  SubAgent spawned WITHOUT label!`);
      api.logger.warn(`[task-lifecycle]    runId: ${event.runId.substring(0, 20)}...`);
      api.logger.warn(`[task-lifecycle]    agentId: ${event.agentId}`);
      api.logger.warn(`[task-lifecycle]    Task tracking SKIPPED - no taskId available`);
      api.logger.warn(`[task-lifecycle]    TIP: Use label="TASK-XXX-YYY: description" when spawning`);
      return; // Skip processing
    }

    // VALIDATION: Extract taskId
    const taskId = extractTaskId(event.label);
    if (!taskId) {
      api.logger.warn(`[task-lifecycle] ⚠️  Label format invalid: "${event.label}"`);
      api.logger.warn(`[task-lifecycle]    Expected format: TASK-XXX-YYY: description`);
      api.logger.warn(`[task-lifecycle]    Task tracking SKIPPED`);
      return; // Skip processing
    }

    // Valid taskId found
    api.logger.info(`[task-lifecycle] ✅ SubAgent spawned with taskId: ${taskId}`);
    api.logger.info(`[task-lifecycle]    runId: ${event.runId.substring(0, 20)}...`);
    api.logger.info(`[task-lifecycle]    agentId: ${event.agentId}`);
    
    // TODO: Cache taskId for this runId (in-memory Map or database)
    // For now, just log success
  });

  // Hook: SubAgent ended
  api.on("subagent_ended", async (event: any, context: any) => {
    api.logger.info(`[task-lifecycle] 🏁 SubAgent ended: ${event.targetSessionKey.substring(0, 30)}...`);
    
    // TODO: Lookup taskId from cache using runId
    // TODO: POST to bridge: http://127.0.0.1:9876/task/complete
    // For now, just log
  });

  api.logger.info("[task-lifecycle] ✅ Hooks registered (AUTO-VALIDATION active)");
}
