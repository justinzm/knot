#!/bin/bash
# Knot - Long-running content production loop
# Usage: ./knot.sh [--tool amp|claude] [--brief "..."] [--brief-file path] [--force-spec] [max_iterations]

set -e

TOOL="claude"
MAX_ITERATIONS=10
INLINE_BRIEF=""
BRIEF_FILE=""
FORCE_SPEC_REFRESH=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    --brief)
      INLINE_BRIEF="$2"
      shift 2
      ;;
    --brief=*)
      INLINE_BRIEF="${1#*=}"
      shift
      ;;
    --brief-file)
      BRIEF_FILE="$2"
      shift 2
      ;;
    --brief-file=*)
      BRIEF_FILE="${1#*=}"
      shift
      ;;
    --force-spec)
      FORCE_SPEC_REFRESH=1
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi

CORE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$CORE_DIR/.." && pwd)"
TASKBOARD_FILE="$BASE_DIR/runtime/taskboard.json"
PROGRESS_FILE="$BASE_DIR/runtime/progress.txt"
SPEC_FILE="$BASE_DIR/runtime/project-spec.json"
ARCHIVE_DIR="$BASE_DIR/runtime/archive"
LAST_RUN_KEY_FILE="$BASE_DIR/runtime/.last-run-key"
VALIDATOR_SCRIPT="$BASE_DIR/automation/scripts/validate_schema.py"
PREFLIGHT_SCRIPT="$BASE_DIR/automation/scripts/run_preflight.py"
SPEC_GENERATOR_SCRIPT="$BASE_DIR/automation/scripts/generate_project_spec.py"
TASKBOARD_SCHEMA="$BASE_DIR/automation/schemas/taskboard.schema.json"
PROJECT_SPEC_SCHEMA="$BASE_DIR/automation/schemas/project-spec.schema.json"

if command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python.exe >/dev/null 2>&1; then
  PYTHON_BIN="python.exe"
else
  echo "Error: No usable Python interpreter found (tried python, python3, python.exe)."
  exit 1
fi

if [[ ! -f "$TASKBOARD_FILE" ]]; then
  echo "Error: Missing $TASKBOARD_FILE"
  exit 1
fi

if [[ ! -f "$VALIDATOR_SCRIPT" ]]; then
  echo "Error: Missing schema validator script: $VALIDATOR_SCRIPT"
  exit 1
fi

if [[ ! -f "$PREFLIGHT_SCRIPT" ]]; then
  echo "Error: Missing preflight script: $PREFLIGHT_SCRIPT"
  exit 1
fi

if [[ ! -f "$SPEC_GENERATOR_SCRIPT" ]]; then
  echo "Error: Missing project spec generator script: $SPEC_GENERATOR_SCRIPT"
  exit 1
fi

if [[ ! -f "$TASKBOARD_SCHEMA" ]]; then
  echo "Error: Missing taskboard schema: $TASKBOARD_SCHEMA"
  exit 1
fi

if [[ "$FORCE_SPEC_REFRESH" -eq 1 || ! -f "$SPEC_FILE" ]]; then
  echo "Project spec: generating via $TOOL..."
  GENERATOR_ARGS=("$PYTHON_BIN" "$SPEC_GENERATOR_SCRIPT" --knot-dir "$BASE_DIR" --tool "$TOOL" --force)
  if [[ -n "$INLINE_BRIEF" ]]; then
    GENERATOR_ARGS+=(--brief "$INLINE_BRIEF")
  fi
  if [[ -n "$BRIEF_FILE" ]]; then
    GENERATOR_ARGS+=(--brief-file "$BRIEF_FILE")
  fi

  if ! "${GENERATOR_ARGS[@]}"; then
    echo "Error: Failed to generate runtime/project-spec.json"
    exit 1
  fi
fi

echo "Preflight: validating taskboard schema..."
if ! "$PYTHON_BIN" "$PREFLIGHT_SCRIPT" --knot-dir "$BASE_DIR"; then
  echo "Error: Knot preflight failed."
  exit 1
fi

CURRENT_RUN_KEY=""

if [[ -f "$SPEC_FILE" ]]; then
  CURRENT_RUN_KEY=$(jq -r '.project_id // .project // empty' "$SPEC_FILE" 2>/dev/null || echo "")
fi

if [[ -z "$CURRENT_RUN_KEY" ]]; then
  CURRENT_RUN_KEY=$(jq -r '.project // empty' "$TASKBOARD_FILE" 2>/dev/null || echo "")
fi

if [[ -f "$LAST_RUN_KEY_FILE" ]]; then
  LAST_RUN_KEY=$(cat "$LAST_RUN_KEY_FILE" 2>/dev/null || echo "")

  if [[ -n "$CURRENT_RUN_KEY" && -n "$LAST_RUN_KEY" && "$CURRENT_RUN_KEY" != "$LAST_RUN_KEY" ]]; then
    DATE=$(date +%Y-%m-%d)
    SAFE_NAME=$(echo "$LAST_RUN_KEY" | sed 's|[^a-zA-Z0-9._-]|-|g')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$SAFE_NAME"

    echo "Archiving previous Knot run: $LAST_RUN_KEY"
    mkdir -p "$ARCHIVE_FOLDER"
    [[ -f "$TASKBOARD_FILE" ]] && cp "$TASKBOARD_FILE" "$ARCHIVE_FOLDER/"
    [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    [[ -f "$SPEC_FILE" ]] && cp "$SPEC_FILE" "$ARCHIVE_FOLDER/"

    echo "# Knot Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

if [[ -n "$CURRENT_RUN_KEY" ]]; then
  echo "$CURRENT_RUN_KEY" > "$LAST_RUN_KEY_FILE"
fi

if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "# Knot Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Knot - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "==============================================================="
  echo "  Knot Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  if [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(amp --dangerously-allow-all < "$CORE_DIR/CLAUDE.md" 2>&1 | tee /dev/stderr) || true
  else
    OUTPUT=$(claude --dangerously-skip-permissions --print < "$CORE_DIR/CLAUDE.md" 2>&1 | tee /dev/stderr) || true
  fi

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Knot completed all stories."
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Knot reached max iterations ($MAX_ITERATIONS) without completing all stories."
echo "Check $PROGRESS_FILE for status."
exit 1
