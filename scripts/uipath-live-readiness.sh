#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FOLDER_NAME="${UIPATH_TACC_FOLDER_NAME:-TreatmentAccessHackathon}"
FOLDER_ID="${UIPATH_TACC_FOLDER_ID:-7986316}"
FOLDER_KEY="${UIPATH_TACC_FOLDER_KEY:-4fba2fa1-012b-469a-b6aa-e5be3811c173}"
RPA_PROJECT="$ROOT_DIR/uipath/robots/PayerPortalFallback"
SOLUTION_DIR="$ROOT_DIR/uipath/solution/treatment-access-command-center"
MODE="${1:-all}"

usage() {
  cat <<'USAGE'
Usage: scripts/uipath-live-readiness.sh [all|local|cloud]

Runs no-side-effect readiness checks for the Treatment Access UiPath lane.

Modes:
  all    Run command-surface, local validation, and read-only cloud discovery.
  local  Run command-surface checks plus local RPA validate/build and solution dry-run.
  cloud  Run read-only UiPath Cloud discovery only.

This script intentionally does not run Agent Builder/Coded Agent jobs, Maestro
debug/run, Action Center task creation, Data Fabric record writes, Orchestrator
job starts, RPA run/debug, or solution upload/publish/deploy/activate.
USAGE
}

run() {
  printf '\n+'
  printf ' %q' "$@"
  printf '\n'
  "$@"
}

run_optional() {
  printf '\n+'
  printf ' %q' "$@"
  printf '  # optional\n'
  if ! "$@"; then
    echo "WARNING: optional readiness check failed; continuing to narrower no-side-effect checks." >&2
  fi
}

run_in() {
  local dir="$1"
  shift
  printf '\n(cd %q &&' "$dir"
  printf ' %q' "$@"
  printf ')\n'
  (cd "$dir" && "$@")
}

case "$MODE" in
  all|local|cloud) ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

cd "$ROOT_DIR"

if [[ "$MODE" == "all" || "$MODE" == "local" ]]; then
  echo "== UiPath live proof hook readiness =="
  run pnpm uipath:live-proof:readiness

  echo "== UiPath command-surface discovery =="
  run uip --version
  run uip tools list --output json
  run uip solution init --help --output json
  run uip rpa init --help --output json
  run uip agent validate --help
  run uip agent run --help
  run uip codedagent --help
  run uip maestro case validate --help
  run uip tasks list --help
  run uip df entities list --help

  echo "== Local RPA and solution checks =="
  run uip solution project list --solution-folder "$SOLUTION_DIR" --output json
  run_optional uip solution resource refresh --solution-folder "$SOLUTION_DIR" --output json
  run_optional uip rpa analyzer-rules list --scope Workflow --project-dir "$RPA_PROJECT" --output json
  (cd "$RPA_PROJECT" && run_optional uip rpa validate --file-path "Main.xaml" --output json)
  run "$ROOT_DIR/scripts/uipath-with-dotnet8.sh" uip rpa build "$RPA_PROJECT" --log-level Warn --output json
  run "$ROOT_DIR/scripts/uipath-with-dotnet8.sh" uip solution pack "$SOLUTION_DIR" --dry-run --output json
fi

if [[ "$MODE" == "all" || "$MODE" == "cloud" ]]; then
  echo "== Read-only UiPath Cloud discovery =="
  echo "Using folder ${FOLDER_NAME} (ID ${FOLDER_ID}, key ${FOLDER_KEY})."
  run uip login status --output json
  run uip or folders get "$FOLDER_NAME" --output json
  run uip or folders runtimes "$FOLDER_NAME" --output json
  run uip or machines list --folder-path "$FOLDER_NAME" --all-fields --output json
  run uip or sessions attended list --folder-path "$FOLDER_NAME" --output json
  run uip tasks users "$FOLDER_ID" --output json
  run uip tasks list --folder-id "$FOLDER_ID" --output json
  run uip df entities list --output json
  run uip agent list --output json
fi

echo
echo "UiPath live readiness checks completed without running live side-effect commands."
