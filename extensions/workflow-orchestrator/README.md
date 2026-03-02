# Workflow Orchestrator Plugin

OpenClaw plugin for tracking multi-step workflows with Definition of Done (DoD) enforcement.

## Problem

When the main agent spawns subagents for multi-step tasks, it may stop prematurely after the first subagent completes, leaving the workflow incomplete. This plugin solves that by:

1. Tracking workflow progress against DoD criteria
2. Waking the requester session when subagents complete
3. Blocking final delivery until all DoD criteria are met

## Usage

### Start a Workflow

```javascript
const result = await orchestrator({
  action: "start",
  task: "Implement feature X",
  dod: [
    "Code implemented and tested",
    "Documentation updated",
    "PR created and reviewed"
  ],
  steps: [
    "Write implementation",
    "Add tests",
    "Update docs",
    "Create PR"
  ]
});
// Returns: { workflowId: "uuid", status: "started", ... }
```

### Check Progress

```javascript
const status = await orchestrator({
  action: "check",
  workflowId: "uuid"
});
// Returns: { progress: { completed: 2, total: 3, percentage: 67 }, ... }
```

### Abort Workflow

```javascript
const result = await orchestrator({
  action: "abort",
  workflowId: "uuid"
});
// Returns: { status: "aborted", ... }
```

## How It Works

1. **Registration**: The plugin registers the `orchestrator` tool with the OpenClaw API
2. **State Tracking**: Workflows are stored in-memory with their DoD criteria and progress
3. **Event Hook**: On `subagent_ended` events, the plugin:
   - Checks if there's an active workflow for the requester
   - Updates completion progress
   - Wakes the requester if work remains (`deliver: false`)
   - Allows final delivery only when all DoD criteria are met (`deliver: true`)

## Installation

```bash
cd extensions/workflow-orchestrator
npm install
npm run build
```

## Configuration

Add to OpenClaw gateway config to enable the plugin:

```json
{
  "extensions": {
    "workflow-orchestrator": {
      "enabled": true
    }
  }
}
```

## Architecture

- **In-memory storage**: Current implementation uses a Map for workflow state
- **Session-aware**: Workflows are tied to requester session keys
- **Event-driven**: Hooks into `subagent_ended` to track progress
- **Non-blocking**: Uses `deliver: false` to wake sessions without interrupting user

## Future Enhancements

- [ ] Persistent storage (SQLite/Redis)
- [ ] Workflow templates
- [ ] Parallel step execution
- [ ] Workflow visualization
- [ ] Time-based triggers
- [ ] Conditional branching

## License

MIT
