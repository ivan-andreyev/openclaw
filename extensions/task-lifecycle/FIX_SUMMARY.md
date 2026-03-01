# SubAgent Hook Context Fix - Complete Summary

## Problem
Plugin hook `subagent_spawned` was firing correctly, but `context.label` was always `undefined`.

### Evidence
```
[plugins] [hooks] running subagent_spawned (1 handlers)
[gateway] [task-lifecycle] ✅ HOOK FIRED! runId: 2364fb04-306e-4cc5-b
[gateway] [task-lifecycle] Label: undefined  ← PROBLEM
```

### Original Code (INCORRECT)
```typescript
api.on("subagent_spawned", async (event, context) => {
  api.logger.info(`Label: ${context.label}`);  // ❌ WRONG - label is in event, not context
});
```

---

## Root Cause

The hook receives TWO parameters:
1. **`event`** (PluginHookSubagentSpawnedEvent) - spawn event data
2. **`context`** (PluginHookSubagentContext) - execution context/metadata

The `label` field exists in **`event`**, not **`context`**.

### Discovered from Source Analysis

**File:** `src/plugins/types.ts`
```typescript
export type PluginHookSubagentSpawnedEvent = {
  runId: string;
  childSessionKey: string;
  agentId: string;
  label?: string;              // ← LABEL IS HERE
  mode: "run" | "session";
  requester?: { ... };
  threadRequested: boolean;
};

export type PluginHookSubagentContext = {
  runId?: string;
  childSessionKey?: string;
  requesterSessionKey?: string;  // ← NO LABEL HERE
};
```

**File:** `src/agents/subagent-spawn.ts` (hook invocation)
```typescript
await hookRunner.runSubagentSpawned(
  {
    runId: childRunId,
    childSessionKey,
    agentId: targetAgentId,
    label: label || undefined,  // ← First parameter (event)
    // ...
  },
  {
    runId: childRunId,
    childSessionKey,
    requesterSessionKey: requesterInternalKey,  // ← Second parameter (context)
  },
);
```

---

## Solution

### Fixed Code
```typescript
api.on("subagent_spawned", async (event, context) => {
  // ✅ CORRECT: Access label from event
  api.logger.info(`Label: ${event.label}`);
  api.logger.info(`AgentId: ${event.agentId}`);
  api.logger.info(`Mode: ${event.mode}`);
  api.logger.info(`ChildSessionKey: ${event.childSessionKey.substring(0, 30)}...`);
  api.logger.info(`RequesterSessionKey: ${context.requesterSessionKey?.substring(0, 30)}...`);
  
  // Extract task ID from label (e.g., "TASK-123: description" -> "TASK-123")
  const taskId = event.label?.split(':')[0]?.trim();
  if (taskId) {
    api.logger.info(`Extracted taskId: ${taskId}`);
  }
});
```

---

## Complete Field Reference

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `runId` | event.runId | string | Unique run identifier |
| `childSessionKey` | event.childSessionKey | string | Session key for spawned subagent |
| `agentId` | event.agentId | string | Target agent ID |
| **`label`** | **event.label** | string? | **Task identifier/description** |
| `mode` | event.mode | "run"\|"session" | Spawn mode |
| `requester` | event.requester | object? | Origin channel/account info |
| `threadRequested` | event.threadRequested | boolean | Whether thread binding was requested |
| `requesterSessionKey` | context.requesterSessionKey | string? | Parent/requester session key |

---

## Files Changed

1. **`extensions/task-lifecycle/index.ts`**
   - Fixed: Changed `context.label` to `event.label`
   - Enhanced: Added comprehensive logging of all available fields
   - Added: Task ID extraction logic

2. **`extensions/task-lifecycle/HOOK_STRUCTURE.md`** (NEW)
   - Complete documentation of event/context structure
   - Examples and common mistakes
   - Type definitions

3. **`extensions/task-lifecycle/FIX_SUMMARY.md`** (NEW)
   - This document

---

## Commit

```
commit 5cdf5540c
fix(plugin): access label from event not context in subagent_spawned hook

- Fixed plugin to use event.label instead of context.label
- Label was always undefined because it's in the event object
- Added comprehensive logging: agentId, mode, childSessionKey, requesterSessionKey
- Added taskId extraction logic from label (e.g. 'TASK-123: description')
- Created HOOK_STRUCTURE.md documenting correct event/context fields
```

---

## Verification Plan

To verify the fix works:

1. Rebuild project: `npm run build`
2. Restart gateway: `openclaw gateway stop && openclaw gateway start`
3. Spawn a subagent with label: `--label "TASK-123-TEST: verification"`
4. Check logs for:
   ```
   [task-lifecycle] Label: TASK-123-TEST: verification
   [task-lifecycle] Extracted taskId: TASK-123-TEST
   ```

---

## Lessons Learned

1. **Hook parameters are NOT symmetric** - Don't assume both parameters have the same fields
2. **Check type definitions first** - `src/plugins/types.ts` has the authoritative structure
3. **Look at invocation site** - `src/agents/subagent-spawn.ts` shows exactly what data is passed
4. **Document the discovery** - Future developers need clear examples of correct usage

---

## Status

✅ **Bug identified and root cause found**  
✅ **Fix implemented and tested (code analysis)**  
✅ **Code committed to repository**  
✅ **Documentation created** (HOOK_STRUCTURE.md)  
⏳ **E2E verification pending** (gateway restart issues)

The fix is structurally correct based on type analysis and source code review. Gateway restart was problematic due to scheduled task management, but the code changes are sound and ready for testing when gateway is restarted properly.
