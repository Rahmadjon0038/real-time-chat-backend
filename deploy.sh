#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME=${IMAGE_NAME:-jamshid-backend}
CONTAINER_NAME=${CONTAINER_NAME:-jamshid-back}
CONTAINER_PORT=${CONTAINER_PORT:-4444}
HOST_PORT=${1:-${PORT:-4444}}
ENV_FILE=${ENV_FILE:-.env}
DATA_DIR=${DATA_DIR:-chat-data}
DB_PATH=${DB_PATH:-/app/data/chat.db}

log() {
  printf '[deploy] %s\n' "$1"
}

log "Building image: ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  log "Removing old container: ${CONTAINER_NAME}"
  docker rm -f "${CONTAINER_NAME}"
fi

mkdir -p "${DATA_DIR}"

run_cmd=(
  docker run -d
  --name "${CONTAINER_NAME}"
  -p "${HOST_PORT}:${CONTAINER_PORT}"
  -e "DB_PATH=${DB_PATH}"
  -v "${PWD}/${DATA_DIR}:/app/data"
)

if [[ -f "${ENV_FILE}" ]]; then
  log "Using env file: ${ENV_FILE}"
  run_cmd+=(--env-file "${ENV_FILE}")
else
  log "No ${ENV_FILE} file found; relying on image defaults"
fi

run_cmd+=("${IMAGE_NAME}")

log "Starting container on port ${HOST_PORT}"
"${run_cmd[@]}"

log "Deployment complete. API: http://localhost:${HOST_PORT}"
