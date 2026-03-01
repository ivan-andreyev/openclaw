# OpenClaw Task Lifecycle Plugin

A TypeScript plugin for OpenClaw that tracks subagent task lifecycle and reports completion events to a bridge service.

## Features

- **Task Tracking**: Automatically tracks subagent spawning and completion
- **Label Validation**: Warns when subagents spawn without proper TASK-XXX-YYY labels
- **LRU Cache**: In-memory cache with disk persistence and automatic eviction
- **Retry Queue**: Failed bridge notifications are retried with exponential backoff
- **Graceful Shutdown**: Ensures all pending operations complete before shutdown
- **ESM Support**: Full ES Module support with TypeScript

## Installation

```bash
cd C:\Users\mrred\.openclaw\plugins\openclaw-task-lifecycle
npm install
npm run build
```

## Configuration

The plugin accepts the following configuration options:

```typescript
{
  bridgeUrl: 'http://127.0.0.1:9876/task/complete',  // Bridge service endpoint
  cacheFile: '.task-cache.json',                      // Cache persistence file
  retryQueueFile: '.retry-queue.json',                // Retry queue persistence file
  maxCacheSize: 1000,                                 // Maximum cache entries
  maxRetryAttempts: 5,                                // Maximum retry attempts
  retryBaseDelayMs: 1000,                             // Base retry delay
  retryMaxDelayMs: 60000                              // Maximum retry delay
}
```

## Usage

Add to your OpenClaw configuration:

```javascript
import createTaskLifecyclePlugin from './plugins/openclaw-task-lifecycle/dist/index.js';

const plugin = await createTaskLifecyclePlugin({
  workspaceDir: '/path/to/workspace',
  config: {
    bridgeUrl: 'http://127.0.0.1:9876/task/complete'
  }
});
```

## Label Validation Strategy

The plugin automatically validates subagent labels to ensure proper task tracking.

### Expected Label Format

```
TASK-XXX-YYY: description
```

Example: `TASK-777-123: Implement feature X`

### Validation Behavior

**When label is missing or invalid:**
- ⚠️ Warning logged to gateway logs
- Helpful tip provided: `"TIP: Use label="TASK-XXX-YYY: description""`
- Task tracking SKIPPED (no database record created)

**When label is valid:**
- ✅ taskId extracted and cached
- Task lifecycle tracked normally
- Completion event sent to bridge

### Error Recovery

**If subagent spawned with incorrect label:**

1. **Agent sees warning in logs**
2. **Agent kills incorrect subagent**
3. **Agent re-spawns with correct label**

**No post-factum correction supported** - by design:
- 95% cases: subagent just started, no progress lost
- 5% cases: rare edge case, manual intervention acceptable
- Avoids overengineering for exceptional scenarios

### Example Logs

```
[task-lifecycle] ⚠️ SubAgent spawned WITHOUT label!
[task-lifecycle]    runId: agent:main:subagent:abc123
[task-lifecycle]    TIP: Use label="TASK-XXX-YYY: description"
[task-lifecycle]    Task tracking SKIPPED

[task-lifecycle] ⚠️ Label format invalid: "phase4-architecture-study"
[task-lifecycle]    Expected format: TASK-XXX-YYY: description
[task-lifecycle]    Task tracking SKIPPED
```

## Hooks

### `subagent_spawning`

Triggered when a subagent is spawned. Creates a task entry in the cache.

```typescript
{
  sessionKey: string;
  label?: string;
  task?: string;
  parentSession?: string;
}
```

### `subagent_ended`

Triggered when a subagent completes. Updates the task entry and sends completion to bridge.

```typescript
{
  sessionKey: string;
  label?: string;
  finalMessage?: string;
  error?: string;
}
```

## Bridge Payload

The plugin sends the following payload to the bridge service:

```typescript
{
  taskId: string;           // Extracted from session key
  sessionKey: string;       // Full session key
  status: 'completed' | 'failed';
  result?: any;             // Final message from subagent
  error?: string;           // Error message if failed
  timestamp: number;        // Completion timestamp
}
```

## Critical Fixes Implemented

- **C0-1**: LRU eviction after set - Ensures cache size limit is maintained
- **C0-2**: Atomic file writes - Uses temp + rename for safe persistence
- **C1-1, C1-2, C1-3**: Full ESM support with proper TypeScript configuration
- **C2-1**: Graceful shutdown - Waits for pending operations before exit
- **C2-2**: Promise tracking - Tracks all async operations for clean shutdown

## Architecture

```
src/
├── types.ts          # TypeScript type definitions
├── cache.ts          # LRU cache with disk persistence
├── retry-queue.ts    # Retry queue with exponential backoff
└── index.ts          # Main plugin implementation

dist/                 # Compiled JavaScript output
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Clean
npm run clean
```

## License

MIT
