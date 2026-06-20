#!/usr/bin/env bash
set -euo pipefail

# deploy-local.sh — Deploy learning-web preview server
#
# Behaviour:
#   - Reads PID from .jenkins/learning-web.pid
#   - Kills any existing learning-web server
#   - Starts vite preview on 127.0.0.1:4173
#   - Saves new PID
#   - Waits for the server to respond
#
# Usage:
#   bash scripts/deploy-local.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="${PROJECT_DIR}/.jenkins"
PID_FILE="${PID_DIR}/learning-web.pid"
DEPLOY_HOST="127.0.0.1"
DEPLOY_PORT="4173"
DEPLOY_URL="http://${DEPLOY_HOST}:${DEPLOY_PORT}"

mkdir -p "$PID_DIR"

log() {
    echo "[deploy-local] $*"
}

error() {
    echo "[deploy-local] ERROR: $*" >&2
    exit 1
}

#
# 1. Stop any existing learning-web server
#
stop_old_server() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            log "Stopping old server (PID $OLD_PID)..."
            kill "$OLD_PID" 2>/dev/null || true
            for i in $(seq 1 10); do
                if ! kill -0 "$OLD_PID" 2>/dev/null; then
                    break
                fi
                sleep 0.5
            done
            # Force kill if still alive
            if kill -0 "$OLD_PID" 2>/dev/null; then
                log "Force killing server (PID $OLD_PID)..."
                kill -9 "$OLD_PID" 2>/dev/null || true
            fi
            log "Old server stopped."
        else
            log "No running server found for PID $OLD_PID."
        fi
        rm -f "$PID_FILE"
    else
        log "No PID file found (no previous server to stop)."
    fi

    # Safety check: ensure port 4173 is free
    if lsof -i ":${DEPLOY_PORT}" -P -n 2>/dev/null | grep -q LISTEN; then
        log "Port ${DEPLOY_PORT} still in use by another process. Attempting to free it..."
        lsof -ti ":${DEPLOY_PORT}" -P -n 2>/dev/null | xargs kill -9 2>/dev/null || true
        sleep 1
        if lsof -i ":${DEPLOY_PORT}" -P -n 2>/dev/null | grep -q LISTEN; then
            error "Port ${DEPLOY_PORT} is still in use. Please free it manually:\n  lsof -ti :${DEPLOY_PORT} | xargs kill -9"
        fi
    fi
}

#
# 2. Start vite preview server
#
start_server() {
    log "Starting vite preview on ${DEPLOY_URL}..."
    cd "$PROJECT_DIR"

    # Use nohup to detach from the shell; capture PID
    nohup npx vite preview \
        --host "$DEPLOY_HOST" \
        --port "$DEPLOY_PORT" \
        > "${PID_DIR}/server.log" 2>&1 &
    NEW_PID=$!

    # Write PID file immediately
    echo "$NEW_PID" > "$PID_FILE"
    log "Server starting with PID $NEW_PID (saved to $PID_FILE)."
}

#
# 3. Wait for the server to respond
#
wait_for_server() {
    log "Waiting for server to respond at ${DEPLOY_URL}..."
    for i in $(seq 1 30); do
        if curl -s -o /dev/null --max-time 2 "${DEPLOY_URL}" 2>/dev/null; then
            log "Server is UP at ${DEPLOY_URL} (attempt $i)."
            return 0
        fi
        sleep 1
    done

    # Server did not start — dump log for debugging
    if [ -f "${PID_DIR}/server.log" ]; then
        echo "=== Server log tail ==="
        tail -20 "${PID_DIR}/server.log"
        echo "======================="
    fi

    error "Server failed to start within 30 seconds. Check ${PID_DIR}/server.log"
}

#
# 4. Confirm the site is responding with HTTP 200-ish
#
confirm_site() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${DEPLOY_URL}")
    log "Site responded with HTTP ${HTTP_CODE}."
    if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 400 ]; then
        error "Site returned HTTP ${HTTP_CODE}, expected 2xx or 3xx."
    fi
    log "Deployment successful: ${DEPLOY_URL}"
}

# ——— Main ———
stop_old_server
start_server
wait_for_server
confirm_site
