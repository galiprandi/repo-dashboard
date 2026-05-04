# ADR 0003: Use git reset --hard for auto-update instead of git pull

## Status

Accepted

## Context

ReleaseHub has two mechanisms for updating the installation:

1. **Auto-update on launch**: The `scripts/start.sh` script checks for updates when the app is launched via the `rhub` command.
2. **Manual update**: The `scripts/install.sh` script updates the repository when running the installation command.

Both scripts originally used `git pull origin main` to update the repository. However, this approach had a critical flaw:

- When there are untracked working tree files (e.g., `package-lock.json`), `git pull` fails with:
  ```
  error: The following untracked working tree files would be overwritten by merge:
          package-lock.json
  Please move or remove them before you merge.
  Aborting
  ```

- This prevents the installation from updating automatically, leaving users with outdated code.

## Decision

Replace `git pull origin main` with `git fetch origin main && git reset --hard origin/main` in both:

- `scripts/start.sh` (line 32)
- `scripts/install.sh` (lines 45-46)

This approach:

1. Fetches the latest changes from the remote
2. Hard-resets the local branch to match the remote exactly
3. Avoids merge conflicts entirely
4. Is appropriate for this use case since:
   - The installation directory (`~/.release-hub`) is a consumer installation, not a development workspace
   - Users should not have local changes in this directory
   - The goal is to always have the exact version from the remote

## Consequences

### Positive

- Auto-update now works reliably even when there are untracked files
- Simpler update mechanism without merge conflict resolution
- Faster updates (no merge operation)

### Negative

- Any local changes in the installation directory will be lost
- This is acceptable since users should not modify the installation directory directly

### Risks

- If a user has intentionally modified files in `~/.release-hub`, those changes will be lost
- Mitigation: Document that users should not modify the installation directory; use the development workspace for modifications

## References

- Commit: `01a4526` - fix: use git reset --hard instead of git pull to avoid merge conflicts in auto-update
- Commit: [pending] - fix: use git reset --hard in install.sh to avoid merge conflicts during update
