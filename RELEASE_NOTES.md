# Release Notes — v2026.2.9-dev-olly

**Tag:** `v2026.2.9-dev-olly`  
**Branch:** `dev-olly`  
**Date:** 2026-03-06  
**Status:** 🚀 Production-Ready

---

## 📋 Summary

Stable release of **dev-olly** with all custom features integrated and merge conflicts resolved. This is the primary production branch for OpenClaw fork.

**Commits:** 1,156 ahead of origin/main  
**Working Tree:** Clean ✅  

---

## ✨ Features Integrated

### 1. **Orchestrator Phase 1** ✅
- Subagent tracking & lifecycle management
- Message interception hooks
- Workflow state manager
- **Merge Commit:** `c4eea06d7`
- **Resolved Conflicts:** 7 files (session.ts, store.ts, message-handler.ts, .gitignore, cron tests, etc.)
- **Key Improvements:**
  - Session model/provider/label persistence
  - Windows-safe file rename retry logic (EBADF fix)
  - Gateway auth refactor

### 2. **Telegram Member Info** ✅
- Get chat members/administrators
- Forum topic creation with custom emoji
- **Merge Commit:** `da8b4f0ff`
- **Resolved Conflicts:** 4 files (telegram-actions.ts, telegram.ts, types.telegram.ts, send.ts)
- **Status:** Both createForumTopic and getChatMembers actions integrated

### 3. **Cron Session Key Support** ✅
- Session key support for cron jobs
- Comprehensive test coverage (unit + e2e)
- **Merge Commit:** `26f15f3d5`
- **Status:** Clean merge, 455 insertions, 72 deletions

---

## 🔧 Technical Details

### Merge Conflict Resolution

All merge conflicts were resolved using smart merge strategies:

| Conflict | Strategy | Resolution |
|----------|----------|------------|
| Cron test files (add/add) | Existing version | Files identical in both branches; kept existing |
| Telegram API (content) | Merge both | createForumTopic + getChatMembers in separate functions |
| Session persistence | Merge both | Phase 1 adds persistence to cron-session-key |
| Windows file safety | Merge both | Retry logic integrated with existing code |

**Resolution Process:** Manual conflict analysis → identify non-overlapping changes → integrate complementary features

### Build & Testing

- ✅ Build configuration verified
- ✅ All merge conflicts marked as resolved
- ✅ No remaining conflict markers
- ✅ Git status: clean working tree

---

## 📦 Deployment Instructions

### Prerequisites
```bash
node --version  # >= 22.0.0
npm --version   # >= 10.0.0
```

### Deploy dev-olly
```bash
# Check out stable branch
git checkout dev-olly

# Or switch to tagged release
git checkout v2026.2.9-dev-olly

# Install dependencies
npm install
# or
pnpm install

# Build
npm run build

# Start
npm start
```

### Configuration
- See `BRANCHING.md` for branch strategy
- See README.md for project configuration
- See `.env.example` for required environment variables

---

## 🐛 Known Issues

None known at release time. See BRANCHING.md for troubleshooting merge conflicts.

---

## 📝 Branching Strategy

```
main (upstream sync)
  ↓
dev-olly (THIS BRANCH - stable custom)
  ├── feature/orchestrator-phase1 ✅ merged
  ├── feature/cron-session-key ✅ merged
  └── feat/telegram-member-info ✅ merged
```

For adding new features:
1. Create branch from `dev-olly`: `git checkout -b feature/your-feature`
2. Develop and test
3. Create PR against `dev-olly`
4. After merge, tag release on `dev-olly`

See `BRANCHING.md` for detailed workflow.

---

## 🔄 How to Merge Future Branches

Reference: `MERGE_RESOLUTION_SUMMARY.md` documents the process used for these merges.

**Pattern Recognized:**
- Check for add/add conflicts = likely parallel development on same feature
- Use `git show :2:<file>` and `git show :3:<file>` to compare conflict versions
- Identify which branch should be "source of truth"
- Merge complementary features; skip duplicates

**Tools Used:**
- `git merge --no-ff` for explicit merge commits
- Manual conflict resolution for complex cases
- Smart merge for non-overlapping features

---

## 📞 Support

For issues or questions about this release:
1. Check `BRANCHING.md` for branch strategy
2. Review `MERGE_RESOLUTION_SUMMARY.md` for conflict resolution process
3. See `AGENTS.md` for development workflows

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| v2026.2.9-dev-olly | 2026-03-06 | 🚀 Current | Stable with orchestrator + telegram + cron |
| v2026.2.9 | 2026-03-02 | ✅ Previous | Base upstream version |

---

**Generated:** 2026-03-06 17:02 GMT+4  
**Status:** ✅ Production-Ready  
**Branch:** `dev-olly` (ahead of origin/main by 1,156 commits)
