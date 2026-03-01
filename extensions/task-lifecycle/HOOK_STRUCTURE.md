# SubAgent Hook Event/Context Structure

## `subagent_spawned` Hook

### Event Object (`PluginHookSubagentSpawnedEvent`)
The **first parameter** contains the spawn event data:

```typescript
{
  runId: string;              // Unique run identifier
  childSessionKey: string;    // Session key for the spawned subagent
  agentId: string;            // Agent ID being spawned
  label?: string;             // ✅ Label/task identifier (e.g., "TASK-123: fix bug")
  mode: "run" | "session";    // Spawn mode
  requester?: {               // Origin information
    channel?: string;
    accountId?: string;
    to?: string;
    threadId?: string | number;
  };
  threadRequested: boolean;   // Whether thread binding was requested
}
```

### Context Object (`PluginHookSubagentContext`)
The **second parameter** contains the context/metadata:

```typescript
{
  runId?: string;                    // Same as event.runId
  childSessionKey?: string;          // Same as event.childSessionKey
  requesterSessionKey?: string;      // ✅ Parent/requester session key
}
```

## Key Differences

| Field | Location | Description |
|-------|----------|-------------|
| `label` | **event.label** | Task identifier/description |
| `agentId` | **event.agentId** | Target agent ID |
| `mode` | **event.mode** | Spawn mode (run/session) |
| `requester` | **event.requester** | Origin channel/account info |
| `requesterSessionKey` | **context.requesterSessionKey** | Parent session key |

## Example Usage

```typescript
api.on("subagent_spawned", async (event, context) => {
  // ✅ CORRECT: Access label from event
  const label = event.label;
  const taskId = label?.split(':')[0]?.trim();  // Extract "TASK-123" from "TASK-123: description"
  
  // ✅ CORRECT: Access requester session from context
  const parentSession = context.requesterSessionKey;
  
  // ❌ WRONG: context.label is undefined
  // const label = context.label;  // DON'T DO THIS
  
  api.logger.info(`SubAgent spawned: ${taskId} (runId: ${event.runId})`);
  api.logger.info(`Parent session: ${parentSession}`);
  api.logger.info(`Agent: ${event.agentId}, Mode: ${event.mode}`);
});
```

## Task ID Extraction

For labels like `"TASK-123: fix verification"`, extract the task ID:

```typescript
const taskId = event.label?.split(':')[0]?.trim();  // "TASK-123"
```

## Source Files

- Type definitions: `src/plugins/types.ts`
  - `PluginHookSubagentSpawnedEvent`
  - `PluginHookSubagentContext`
- Hook invocation: `src/agents/subagent-spawn.ts`
  - `hookRunner.runSubagentSpawned(event, context)`
