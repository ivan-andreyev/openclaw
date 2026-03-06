# Installation Guide - Workflow Orchestrator Plugin (Phase 1)

## Prerequisites

- Node.js >= 18.0.0
- OpenClaw Gateway installed
- npm or yarn package manager

---

## Quick Install

### 1. Navigate to Plugin Directory
```bash
cd extensions/workflow-orchestrator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Plugin
```bash
npm run build
```

**Expected output:**
```
> @openclaw/workflow-orchestrator@0.1.0 build
> tsc

(No errors - build successful)
```

### 4. Run Tests (Optional but Recommended)
```bash
npm test
```

**Expected output:**
```
Test Suites: 4 passed, 4 total
Tests:       49 passed, 49 total
```

### 5. Enable Plugin in Gateway Config

**Option A: Direct Config Edit**

Edit your OpenClaw gateway config file (typically `~/.openclaw/config.json` or `gateway.config.json`):

```json
{
  "extensions": {
    "workflow-orchestrator": {
      "enabled": true
    }
  }
}
```

**Option B: Using OpenClaw CLI**

```bash
openclaw config set extensions.workflow-orchestrator.enabled true
```

### 6. Restart Gateway

```bash
openclaw gateway restart
```

### 7. Verify Plugin Loaded

Check gateway logs for:
```
[workflow-orchestrator] Initializing v0.1.0-phase1 (Phase 1 MVP)
[workflow-orchestrator] Hooks registered (Phase 1 MVP)
[workflow-orchestrator] Initialization complete
```

---

## Verification

### Test Subagent Tracking

1. Spawn a subagent from main agent
2. Check gateway logs for:
   ```
   [workflow-orchestrator] Tracked subagent {
     childSessionKey: "agent:...",
     runId: "...",
     label: "...",
     requesterSessionKey: "..."
   }
   ```

3. When subagent completes, check for:
   ```
   [workflow-orchestrator] Subagent ended {
     targetSessionKey: "...",
     outcome: "ok",
     durationMs: ...,
     remainingSubagents: 0
   }
   ```

### Test Message Blocking

1. While a subagent is active, try to send a completion message:
   ```
   "I'm done with the task!"
   ```

2. Check gateway logs for:
   ```
   [workflow-orchestrator] Blocked premature completion message {
     to: "...",
     contentPreview: "I'm done with the task!",
     activeSubagents: 1
   }
   ```

3. After all subagents complete, send the same message
4. Check for:
   ```
   [workflow-orchestrator] Allowed completion message (no active subagents) {
     to: "...",
     activeSubagents: 0
   }
   ```

---

## Troubleshooting

### Build Fails

**Error:** TypeScript compilation errors

**Solution:**
1. Check Node.js version: `node --version` (should be >= 18.0.0)
2. Clean and rebuild:
   ```bash
   npm run clean
   npm install
   npm run build
   ```

### Plugin Not Loading

**Symptom:** No logs from `[workflow-orchestrator]` in gateway logs

**Check:**
1. Verify `openclaw.plugin.json` exists in plugin directory
2. Verify `dist/` directory exists and contains compiled files
3. Check gateway config: `openclaw config get extensions.workflow-orchestrator.enabled`
4. Restart gateway: `openclaw gateway restart`
5. Check gateway logs for errors: `openclaw gateway logs | grep error`

### Tests Fail

**Error:** Jest tests failing

**Solution:**
1. Check dependencies are installed: `npm install`
2. Run tests with verbose output: `npm test -- --verbose`
3. Check for conflicting Node.js versions
4. Clear Jest cache: `npm test -- --clearCache`

### Messages Not Being Blocked

**Symptom:** Completion messages not blocked even when subagents are active

**Check:**
1. Verify plugin is loaded (check logs)
2. Verify `message_sending` hook is registered
3. Check if message matches completion patterns:
   - "I'm done"
   - "task complete"
   - "finished"
   - "[COMPLETED]"
4. Increase log level to debug:
   ```json
   {
     "logging": {
       "level": "debug"
     }
   }
   ```

### Subagents Not Being Tracked

**Symptom:** No "Tracked subagent" logs when subagents spawn

**Check:**
1. Verify plugin is loaded
2. Check if `subagent_spawned` hook is registered
3. Look for warnings: "No requesterSessionKey in context"
4. Verify subagent spawn events are firing (check gateway debug logs)

---

## Development Mode

### Watch Mode (Auto-Rebuild)
```bash
npm run watch
```

This will automatically rebuild the plugin when source files change.

### Test Watch Mode
```bash
npm run test:watch
```

This will automatically rerun tests when source files change.

### Coverage Report
```bash
npm run test:coverage
```

This will generate a detailed coverage report in `coverage/` directory.

---

## Uninstall

### 1. Disable Plugin
```bash
openclaw config set extensions.workflow-orchestrator.enabled false
```

Or edit config:
```json
{
  "extensions": {
    "workflow-orchestrator": {
      "enabled": false
    }
  }
}
```

### 2. Restart Gateway
```bash
openclaw gateway restart
```

### 3. Remove Plugin Files (Optional)
```bash
cd extensions
rm -rf workflow-orchestrator
```

---

## Upgrade

### From Phase 1 to Phase 2 (Future)

When Phase 2 is released:

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild:
   ```bash
   npm install
   npm run build
   ```

3. Restart gateway:
   ```bash
   openclaw gateway restart
   ```

4. Check logs for new features:
   ```
   [workflow-orchestrator] Initializing v0.2.0-phase2
   [workflow-orchestrator] Session wake enabled
   [workflow-orchestrator] State persistence enabled
   ```

---

## Configuration Options (Phase 1)

Currently, the plugin has no configurable options. All features are enabled by default when the plugin is enabled.

**Future configuration options (Phase 2+):**
- `sessionWake.enabled` - Enable/disable automatic session wake
- `persistence.enabled` - Enable/disable state persistence
- `persistence.storageType` - Storage backend (json, sqlite, redis)
- `messageDetection.customPatterns` - Custom completion message patterns

---

## Support

### Documentation
- [README-PHASE1.md](README-PHASE1.md) - User guide
- [PHASE1-MVP-COMPLETE.md](PHASE1-MVP-COMPLETE.md) - Implementation details

### Logs
View gateway logs:
```bash
openclaw gateway logs
```

Filter for plugin logs:
```bash
openclaw gateway logs | grep workflow-orchestrator
```

### Debugging
Enable debug logging:
```json
{
  "logging": {
    "level": "debug"
  }
}
```

---

## Next Steps

After installation:
1. Read [README-PHASE1.md](README-PHASE1.md) for usage examples
2. Test with real subagent spawns
3. Monitor gateway logs for tracking events
4. Report issues or request Phase 2 features

---

**Installation complete!** The Workflow Orchestrator plugin is now tracking subagents and preventing premature completion messages.
