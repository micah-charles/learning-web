# Local Jenkins CI/CD for learning-web

## Overview

Jenkins runs locally on the iMac at `http://127.0.0.1:8080` and watches the
GitHub repository for changes.

**PR / feature branches** — build + QA only, no deployment.

**main branch** — build, deploy to `http://127.0.0.1:4173`, then full QA
against the deployed site.

---

## Installation

Jenkins was installed via Homebrew:

```bash
brew install jenkins-lts
```

### Start / Stop / Restart

```bash
brew services start jenkins-lts     # start background service
brew services stop jenkins-lts      # stop
brew services restart jenkins-lts   # restart
```

Jenkins home directory: `~/.jenkins/`  
Jenkins is accessible at: [http://127.0.0.1:8080](http://127.0.0.1:8080)

> **Security**: Jenkins is currently running with `useSecurity=false` for local
> development convenience. Anyone with network access to port 8080 can
> administer Jenkins. To enable security, go to:
> `Manage Jenkins → Security → Enable Security`.
> See [Jenkins security docs](https://www.jenkins.io/doc/book/security/) for
> guidance on setting up authentication.

### Installed Plugins

| Plugin | Purpose |
|--------|---------|
| Git | Checkout source from GitHub |
| GitHub Branch Source | Discover branches and PRs |
| Pipeline (workflow-aggregator) | Run Jenkinsfile pipelines |
| Multibranch Pipeline (built-in) | Per-branch pipeline jobs |
| NodeJS | Node.js tool support |
| Lockable Resources | Prevent concurrent deployments |
| Blue Ocean | Modern Jenkins UI |

---

## Job: `learning-web` Multibranch Pipeline

The job is configured as a Multibranch Pipeline that:

1. Scans the repository every 60 seconds for new branches / PRs.
2. For each branch, runs the `Jenkinsfile` from the root of the repository.
3. PR branches trigger automatically on push.

### Discovery pattern

Branches matching `main`, `PR-*`, or `codex/*` are discovered and built.

---

## PR Flow (any non-main branch)

```
Checkout → npm ci → npm run build → QA:config-check → QA:smoke → Done
```

- The project is built and QA-validated.
- **No server is deployed.**
- No persistent process is left running.
- Playwright starts a temporary dev server on port **4175** during smoke tests,
  then shuts it down.

---

## Main Branch Flow

```
Checkout → npm ci → npm run build → Deploy (port 4173) → Full QA → Done
```

1. **Build**: `npm run build` produces `dist/`.
2. **Deploy**: `scripts/deploy-local.sh`:
   - Stops any previous learning-web server (reads `.jenkins/learning-web.pid`).
   - Starts `npx vite preview --host 127.0.0.1 --port 4173`.
   - Saves the PID to `.jenkins/learning-web.pid`.
   - Waits for the site to respond at `http://127.0.0.1:4173`.
3. **QA**: Runs `qa:smoke` and `qa:data-sample` against the deployed server
   (via `QA_BASE_URL=http://127.0.0.1:4173 QA_USE_LOCAL_SERVER=false`).

A **Lockable Resource** (`learning-web-deploy`) prevents two deployments from
running concurrently.

---

## Checking the Local Site

After a main branch deployment, visit:

```
http://127.0.0.1:4173
```

To confirm the server is running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4173
# Expected: 200
```

---

## Manually Stopping the Deployed Server

### Using the deploy script (preferred):

```bash
bash scripts/deploy-local.sh
# This stops the old server (if any) and starts a new one.
```

### Using the PID file:

```bash
kill "$(cat .jenkins/learning-web.pid)" 2>/dev/null
rm -f .jenkins/learning-web.pid
```

### Using the port:

```bash
lsof -ti :4173 | xargs kill -9
```

---

## Troubleshooting

### Port 4173 already in use

```bash
# Find what is using port 4173
lsof -i :4173 -P -n

# Kill it
lsof -ti :4173 | xargs kill -9
```

Then re-deploy:

```bash
bash scripts/deploy-local.sh
```

### Jenkins not starting

```bash
brew services restart jenkins-lts
tail -f ~/Library/Logs/jenkins-lts/jenkins.log
```

### Pipeline fails with "No Jenkinsfile found"

Ensure the `Jenkinsfile` exists at the root of the repository and is pushed
to the branch being built.

### Plugin installation issues

If a required plugin is missing, install it from the Jenkins UI:

```
Manage Jenkins → Plugins → Available plugins → Search → Install
```

Or restart Jenkins — plugins are loaded from `~/.jenkins/plugins/`.

### Concurrent deployment conflict

The Lockable Resources plugin prevents this. If a deployment is stuck, check:

```
Jenkins → Lockable Resources → Release the lock manually
```
