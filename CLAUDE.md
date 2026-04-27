# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

Knot is an autonomous loop framework for content production workflows (scripts, storyboards, prompts, editorial calendars). It is **not** a software-delivery tool. Stories are reviewable content units; gates are validation + review + compliance; "done" means an artifact is written, approved, and state is persisted.

The default loop: `produce → validate → review → revise → approve → persist`.

## Common Commands

All commands assume the current working directory is the repository root (`D:\dev\MyProject\knot`). The README documents these same commands from one level up — adjust the `knot/` prefix accordingly.

### Generate project spec from brief

```bash
python automation/scripts/generate_project_spec.py --knot-dir . --tool claude --force
```

`--force` writes `runtime/project-spec.json`; without it only `runtime/project-spec.generated.json` is written. Brief priority: `--brief "..."` > `--brief-file path` > `runtime/project-brief.md`.

### Validate any JSON against a schema

```bash
python automation/scripts/validate_schema.py \
  --schema automation/schemas/taskboard.schema.json \
  --input runtime/taskboard.json
```

Exit codes: `0` = valid, `1` = schema fail, `2` = file/parse error.

### Run preflight (taskboard + optional project-spec)

```bash
python automation/scripts/run_preflight.py --knot-dir .
```

Writes `runtime/reviews/preflight/latest.json` and appends a `PRECHECK` entry to `runtime/progress.txt`.

### Start the loop

```bash
./core/knot.sh                                  # default: claude, 10 iterations
./core/knot.sh --tool amp 5                     # amp, 5 iterations
./core/knot.sh --brief "..." --force-spec       # regenerate spec from inline brief
```

`knot.sh` runs preflight as a **hard gate** before entering the loop. The loop exits early when an iteration emits `<promise>COMPLETE</promise>`.

### Tests

The test suite uses Python's stdlib `unittest`. Tests assume they are launched from the parent of the `knot/` directory (they compute `ROOT = Path(__file__).resolve().parents[3]` and look up `ROOT / "knot"`).

```bash
# from the parent directory of this repo
python -m unittest discover -s knot/automation/tests

# single test file
python -m unittest knot.automation.tests.test_run_preflight

# single test method
python -m unittest knot.automation.tests.test_validate_schema.ValidateSchemaCliTests.test_valid_taskboard_example_passes
```

## Architecture

### Three-tier separation

- **`core/`** — execution layer
  - `knot.sh`: bash runner that orchestrates spec generation → preflight → iteration loop. Detects python/python3/python.exe. Archives the previous run to `runtime/archive/<date>-<project>/` when `project_id` changes. Detects `<promise>COMPLETE</promise>` in iteration output to exit early.
  - `CLAUDE.md`: **iteration prompt** consumed by `knot.sh` — *not* project-level guidance. Tells the model to complete exactly one story per run. Do not confuse this with the file you are reading now.
  - `PROJECT_SPEC_GENERATOR.md`: prompt embedded into `generate_project_spec.py`.

- **`automation/`** — schema and validation infrastructure
  - `schemas/`: JSON Schema (Draft 2020-12) definitions — `taskboard.schema.json`, `project-spec.schema.json`, `story.schema.json`, `review-result.schema.json`, `preflight-report.schema.json`.
  - `scripts/validate_schema.py`: generic validator with `RefResolver` for `$ref` support across schemas.
  - `scripts/run_preflight.py`: validates `runtime/taskboard.json` (required) plus `runtime/project-spec.json` (if present); emits structured report and appends to progress log.
  - `scripts/generate_project_spec.py`: builds prompt from `PROJECT_SPEC_GENERATOR.md` + scanned project context (`config.json`, `script/`, `assets/`, `outputs/`, taskboard, progress) + brief, invokes the AI CLI, validates output against the spec schema. Handles `.ps1`-resolved CLIs on Windows by shelling through `pwsh`/`powershell`.
  - `tests/`: `unittest`-based tests covering each script.

- **`runtime/`** — mutable per-project state
  - `taskboard.json`: stories with `id`, `inputs`, `outputs`, `dependencies`, `review_policy.required_gates`, status. The single source of truth for what to do next.
  - `progress.txt`: **append-only** memory. Pattern Memory section at top stores reusable workflow rules; PRECHECK and per-iteration entries follow.
  - `project-spec.json`: optional but recommended; pins style/language/medium/review policy across iterations.
  - `project-brief.md`: human-written input that drives AI generation of the spec.
  - `reviews/preflight/latest.json`: most recent preflight report.
  - `archive/`: snapshots of previous runs (taskboard + progress + spec).

### Iteration model

Each loop iteration runs in a **fresh context** — the model only sees `core/CLAUDE.md` plus the files it chooses to read. Per-iteration constraints from `core/CLAUDE.md`:

1. Pick the highest-priority `todo`/`ready`/`needs_revision` story whose dependencies are all `done`.
2. Read only the inputs that story needs.
3. Run the gate set declared in `review_policy.required_gates` (typically `existence`, `structure`, `business`, `compliance`).
4. On gate failure → `needs_revision` or `blocked` with notes; on full pass → `done`.
5. Append (never overwrite) a structured entry to `progress.txt`.
6. If every story is `done`, output `<promise>COMPLETE</promise>` so `knot.sh` exits.

### Data flow

```
project-brief.md ─┐
                  ├─► generate_project_spec.py ─► project-spec.json
config.json + ────┤    (validates against project-spec.schema.json)
script/, assets/  │
                  └─► run_preflight.py ─► preflight/latest.json + progress.txt
                          │                  (gate: must pass before loop)
                          ▼
                       knot.sh loop ─► iteration prompt (core/CLAUDE.md)
                          │                  picks 1 story, runs gates, persists
                          ▼
                       taskboard.json + progress.txt + outputs/, assets/
```

## Working with This Codebase

- **Don't confuse `core/CLAUDE.md` with this file.** That file is the iteration system prompt; its rules ("work on exactly one story") apply to the runtime loop, not to development work.
- **Schemas are the contract.** When changing `taskboard.json` shape, story status enums, or report formats, update the corresponding schema in `automation/schemas/` and the example in `examples/` together. Tests in `automation/tests/` reference the example files.
- **Preflight is a hard gate.** `knot.sh` will not enter the loop if `run_preflight.py` fails. Investigating loop failures should always start with `runtime/reviews/preflight/latest.json` and the latest entry in `runtime/progress.txt`.
- **Append-only progress.** Never rewrite `runtime/progress.txt` wholesale; treat it as a journal. Reusable rules go under `## Workflow Patterns` near the top.
- **Project context auto-scan.** `generate_project_spec.py` reads `.claude/CLAUDE.md`, `config.json`, and the `script/`, `assets/`, `outputs/` directories from the parent of `--knot-dir` — so when used as a subdirectory of a host project, those paths matter.
- **AI CLI dependency.** `generate_project_spec.py` and `knot.sh` shell out to `claude` or `amp`. On Windows, both are commonly installed as `.ps1` scripts; the generator already handles this, the runner relies on Bash.

## Key Files When Investigating Issues

- Loop won't start → `core/knot.sh` (preflight gate) → `runtime/reviews/preflight/latest.json`.
- Story won't advance → `runtime/taskboard.json` (status, dependencies) → `runtime/progress.txt` tail.
- Spec generation issues → `automation/scripts/generate_project_spec.py` and `core/PROJECT_SPEC_GENERATOR.md`.
- Schema rejection → `automation/schemas/*.schema.json` plus `examples/*.example.json` for shape reference.
- Operator-level walkthrough → `docs/OPERATION_MANUAL.md`; schema reference → `docs/SCHEMAS.md`.
