# Fork Branching Strategy

This document describes the branching strategy used in this fork of OpenClaw.

## Overview

This fork maintains a stable custom version (`dev-olly`) alongside upstream synchronization. The branching model supports three tiers:

```
main (upstream sync)
  ↓
dev-olly (stable custom)
  ↓
feature/* (development)
```

## Branches

### `main`
- **Purpose:** Upstream synchronization point
- **Source:** Synced from `openclaw/openclaw:main`
- **Status:** Reflects upstream state
- **Update frequency:** As needed (typically weekly or after upstream releases)
- **Usage:** Integration branch for upstream changes
- **Protection:** Rebase-only from upstream

**How to sync:**
```bash
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main
```

### `dev-olly`
- **Purpose:** Stable version with fork-specific customizations
- **Source:** Branches from `main`
- **Status:** Production-ready custom version
- **Stability:** More stable than `main`, tested locally
- **Usage:** Primary branch for custom deployments
- **Update frequency:** After testing new upstream changes merged into `main`

**What goes here:**
- Tested and approved customizations
- Bug fixes specific to fork requirements
- Custom features that won't be upstreamed
- Stable version tag releases

**How to update from main:**
```bash
git checkout dev-olly
git pull origin dev-olly
git merge main --no-ff
# Test thoroughly before pushing
git push origin dev-olly
```

### `feature/*`
- **Purpose:** Active development and experimentation
- **Source:** Branches from `dev-olly` or `main`
- **Status:** Work-in-progress
- **Protection:** No protection - local work
- **Usage:** Individual feature development and bug fixes

**Naming convention:**
```
feature/brief-description
feature/issue-123-fix-xyz
feature/experimental-endpoint-v2
```

**How to create:**
```bash
git checkout dev-olly
git pull origin dev-olly
git checkout -b feature/your-feature-name
# Work...
git commit -m "description"
git push origin feature/your-feature-name
```

## Workflow

### For Custom Modifications

1. **Create feature branch** from `dev-olly`:
   ```bash
   git checkout dev-olly
   git pull origin dev-olly
   git checkout -b feature/my-custom-fix
   ```

2. **Develop and test**:
   ```bash
   # Make changes
   npm install  # if needed
   # Test locally
   git commit -m "Clear message"
   ```

3. **Merge to `dev-olly`** when ready:
   ```bash
   git checkout dev-olly
   git pull origin dev-olly
   git merge --no-ff feature/my-custom-fix
   git push origin dev-olly
   ```

4. **Clean up**:
   ```bash
   git branch -d feature/my-custom-fix
   git push origin --delete feature/my-custom-fix
   ```

### For Upstream Syncing

1. **Update `main` from upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git rebase upstream/main
   git push origin main
   ```

2. **Test upstream changes** in temporary branch:
   ```bash
   git checkout -b feature/test-upstream
   git merge main
   # Test...
   ```

3. **Merge into `dev-olly`** after validation:
   ```bash
   git checkout dev-olly
   git merge main --no-ff -m "Merge upstream changes as of commit XXX"
   git push origin dev-olly
   ```

## Release Management

### Tagging `dev-olly` Releases

```bash
git checkout dev-olly
git tag -a v1.2.3-dev-olly -m "Release v1.2.3 for dev-olly branch"
git push origin v1.2.3-dev-olly
```

### Version Scheme

Use semantic versioning with a `-dev-olly` suffix:
- `v1.2.3-dev-olly` — Production release on `dev-olly`
- `v1.2.3-beta.1-dev-olly` — Beta/RC for `dev-olly`

## Merge Conflict Resolution

### When merging `main` into `dev-olly`

If conflicts arise:

1. **Identify the conflict**:
   ```bash
   git status
   ```

2. **Resolve conflicts** manually (editor or merge tool)

3. **Favor `dev-olly` changes** if conflicts are in fork-specific code
   ```bash
   git checkout --ours <file>  # Keep dev-olly version
   # or
   git checkout --theirs <file>  # Use main version
   ```

4. **Complete merge**:
   ```bash
   git add <resolved-files>
   git commit -m "Merge main into dev-olly - resolved conflicts"
   git push origin dev-olly
   ```

## Best Practices

1. **Keep `main` clean** — only sync from upstream, no custom commits
2. **Test thoroughly on `dev-olly`** before using in production
3. **Use `--no-ff` for merges** to preserve branch history
4. **Write clear commit messages** especially for customizations
5. **Document why customizations exist** in PR descriptions or comments
6. **Review upstream changes** before merging `main` into `dev-olly`
7. **Keep feature branches short-lived** — merge or close within a few days

## Troubleshooting

### "dev-olly is ahead of main"
This is normal and expected. `dev-olly` contains custom commits not in upstream.

### "main is ahead of dev-olly"
This means upstream has new changes. Merge `main` into `dev-olly` after testing.

### "Revert a commit to dev-olly"
```bash
git checkout dev-olly
git revert <commit-hash>
git push origin dev-olly
```

### "Cherry-pick from main to dev-olly"
```bash
git checkout dev-olly
git cherry-pick <commit-hash>
git push origin dev-olly
```

## Related Files

- `README.md` — Main project documentation
- `.github/workflows/` — CI/CD configuration
- `CONTRIBUTING.md` — Contribution guidelines (if present)

---

**Last updated:** 2026-03-06  
**Branch:** `dev-olly`
