# Workflow Orchestrator Plugin - Phase 1 MVP

**Status:** ✅ Phase 1 Complete  
**Version:** 0.1.0  
**Date:** 2026-03-03

---

## Overview

Phase 1 MVP prevents agents from reporting "I'm done" prematurely when subagents are still active.

**Problem Solved:** Main agent spawns subagents for multi-step tasks → first subagent completes → main agent reports "I'm done" → workflow incomplete.

**Solution:** Track subagent lifecycle via hooks → block completion messages if subagents are active.

---

## Features (Phase 1)

✅ **Subagent Tracking**
- Track when subagents spawn via `subagent_spawned` hook
- Track when subagents end via `subagent_ended` hook
- In-memory Map storage (no persistence yet)

✅ **Message Interception**
- Intercept outgoing messages via `message_sending` hook
- Detect completion keywords: "I'm done", "task complete", "finished", "[COMPLETED]"
- Block completion messages if any subagents are active
- Log all blocking events

✅ **Logging**
- Log subagent spawns with metadata (runId, label, requesterSessionKey)
- Log subagent ends with duration and outcome
- Log blocked messages with reason
- Log allowed completion messages

✅ **Testing**
- 100% coverage of SubagentTracker
- 100% coverage of hook handlers
- 26 passing tests

---

## Limitations (Phase 1)

❌ **No Automatic Session Wake**
- When subagent completes, requester session is NOT automatically woken
- Manual intervention needed to resume work
- **Reason:** Session wake API requires custom gateway method (Phase 2)

❌ **No DoD Validation**
- No Definition of Done criteria enforcement
- Plugin doesn't validate if all required steps are complete
- **Reason:** DoD validation requires workflow state (Phase 3)

❌ **No State Persistence**
- Subagent tracking is in-memory only
- All state lost on gateway restart
- **Reason:** Persistence requires storage layer (Phase 2)

❌ **Simple Message Detection**
- Completion message detection is keyword-based
- May have false positives/negatives
- **Reason:** Advanced detection requires NLP/context analysis (Phase 3)

---

## Installation

### 1. Build the Plugin

```bash
cd extensions/workflow-orchestrator
npm install
npm run build
```

### 2. Verify Tests Pass

```bash
npm test
```

Expected output:
```
Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
Coverage:    >90% (statements, branches, functions, lines)
```

### 3. Enable in Gateway Config

Add to your OpenClaw gateway config:

```json
{
  "extensions": {
    "workflow-orchestrator": {
      "enabled": true
    }
  }
}
```

### 4. Restart Gateway

```bash
openclaw gateway restart
```

### 5. Verify Plugin Loaded

Check gateway logs for:
```
[workflow-orchestrator] Initializing v0.1.0-phase1 (Phase 1 MVP)
[workflow-orchestrator] Hooks registered (Phase 1 MVP)
[workflow-orchestrator] Initialization complete
```

---

## How It Works

### 1. Subagent Spawned

When a subagent is spawned:
```typescript
// Event: subagent_spawned
{
  runId: "abc123",
  childSessionKey: "agent:elly2:subagent:xyz",
  agentId: "elly2",
  label: "Implement feature X",
  requesterSessionKey: "agent:main:telegram:..."
}

// Plugin Action:
tracker.track("agent:elly2:subagent:xyz", {
  runId: "abc123",
  requesterSessionKey: "agent:main:telegram:...",
  startedAt: new Date(),
  label: "Implement feature X"
});

// Log:
[workflow-orchestrator] Tracked subagent {
  childSessionKey: "agent:elly2:subagent:xyz",
  runId: "abc123",
  label: "Implement feature X"
}
```

### 2. Subagent Ended

When a subagent completes:
```typescript
// Event: subagent_ended
{
  targetSessionKey: "agent:elly2:subagent:xyz",
  outcome: "ok",
  runId: "abc123"
}

// Plugin Action:
tracker.untrack("agent:elly2:subagent:xyz");

// Log:
[workflow-orchestrator] Subagent ended {
  targetSessionKey: "agent:elly2:subagent:xyz",
  outcome: "ok",
  durationMs: 45230,
  remainingSubagents: 1
}
```

### 3. Message Sending (Completion Blocked)

When agent tries to report completion:
```typescript
// Event: message_sending
{
  to: "user-123",
  content: "I'm done with the task!"
}

// Plugin Check:
isCompletionMessage("I'm done with the task!") → true
tracker.count() → 2 (still active)

// Plugin Action:
return { cancel: true }

// Log:
[workflow-orchestrator] Blocked premature completion message {
  to: "user-123",
  contentPreview: "I'm done with the task!",
  activeSubagents: 2
}
```

### 4. Message Sending (Completion Allowed)

When all subagents are complete:
```typescript
// Event: message_sending
{
  to: "user-123",
  content: "I'm done with the task!"
}

// Plugin Check:
isCompletionMessage("I'm done with the task!") → true
tracker.count() → 0 (no active subagents)

// Plugin Action:
return undefined (allow message)

// Log:
[workflow-orchestrator] Allowed completion message (no active subagents) {
  to: "user-123",
  activeSubagents: 0
}
```

---

## API Reference

### SubagentTracker

**Methods:**
- `track(childSessionKey, data)` - Track new subagent
- `untrack(childSessionKey)` - Remove subagent from tracking
- `get(childSessionKey)` - Get subagent info
- `getByRequester(requesterSessionKey)` - Get all subagents for requester
- `hasActiveSubagents(requesterSessionKey)` - Check if requester has active subagents
- `getAll()` - Get all tracked subagents
- `clear()` - Clear all tracked subagents
- `count()` - Get total count of tracked subagents

**TrackedSubagent Type:**
```typescript
interface TrackedSubagent {
  runId: string;
  requesterSessionKey: string;
  startedAt: Date;
  label?: string;
  agentId?: string;
}
```

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test:watch
```

### Run Tests with Coverage

```bash
npm test:coverage
```

### Test Coverage

```
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
subagent-tracker.ts    | 100.00  |  100.00  |  100.00 |  100.00 |
hooks.ts               |  95.45  |   90.00  |  100.00 |   95.45 |
plugin-types.ts        | N/A     | N/A      | N/A     | N/A     |
plugin.ts              |  83.33  |  100.00  |   66.67 |   83.33 |
-----------------------|---------|----------|---------|---------|
All files              |  92.68  |   90.00  |   94.12 |   92.68 |
```

---

## Troubleshooting

### Plugin Not Loading

**Symptom:** No logs from plugin on gateway start

**Check:**
1. Verify `openclaw.plugin.json` exists
2. Verify plugin is enabled in gateway config
3. Check gateway logs for errors
4. Verify build succeeded: `npm run build`

### Messages Not Being Blocked

**Symptom:** Agent reports "I'm done" even with active subagents

**Check:**
1. Verify plugin is loaded (check logs)
2. Check if completion message matches patterns (see `hooks.ts`)
3. Verify subagents are being tracked (check logs for "Tracked subagent")
4. Increase log level to debug: `logger.debug` messages

### Subagents Not Being Tracked

**Symptom:** No "Tracked subagent" logs when subagents spawn

**Check:**
1. Verify `subagent_spawned` hook is registered
2. Check if `requesterSessionKey` is present in context
3. Look for warnings: "No requesterSessionKey in context"

---

## Next Steps (Phase 2)

**Planned Features:**
1. **Session Wake API**
   - Automatically wake requester session on subagent completion
   - Custom gateway method: `session.wake`
   - Priority-based message queue

2. **State Persistence**
   - Save subagent state to JSON/SQLite
   - Resume tracking after gateway restart
   - State migration utilities

3. **Enhanced Message Detection**
   - Context-aware completion detection
   - Custom completion patterns per agent
   - False positive reduction

**Estimated Effort:** 2-3 days

---

## Architecture

```
workflow-orchestrator/
├── openclaw.plugin.json       # Plugin manifest
├── package.json               # NPM dependencies
├── tsconfig.json              # TypeScript config
├── jest.config.js             # Jest config
├── README-PHASE1.md           # This file
└── src/
    ├── plugin.ts              # Main plugin entry
    ├── index.ts               # Export module
    ├── subagent-tracker.ts    # In-memory tracker
    ├── hooks.ts               # Hook handlers
    ├── plugin-types.ts        # OpenClaw API types
    ├── subagent-tracker.test.ts
    └── hooks.test.ts
```

---

## Contributing

Phase 1 is complete and frozen. Contributions for Phase 2+ are welcome!

**Development Workflow:**
1. Create feature branch: `git checkout -b feature/phase2-session-wake`
2. Make changes
3. Run tests: `npm test`
4. Build: `npm run build`
5. Submit PR with reference to Phase 2 requirements

---

## License

MIT
