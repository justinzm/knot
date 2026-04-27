# Knot Schemas

Knot now ships with formal JSON Schemas in [automation/schemas](/d:/dev/aigcFile/ai_shot_team_seedance/knot/automation/schemas:1):

- `taskboard.schema.json`
- `project-spec.schema.json`
- `story.schema.json`
- `review-result.schema.json`
- `preflight-report.schema.json`

These schemas follow the `C` direction we discussed:

- strict core fields
- explicit enums for status and gates
- open extension points through `metadata` and `extensions`

## Taskboard Schema

`taskboard.schema.json` is the contract for the full `taskboard.json` document.

Core rules:

- taskboard identity lives at the top level
- `stories` must be a non-empty array
- every story must satisfy `story.schema.json`
- `metadata` and `extensions` are available for project-level customization

Recommended use:

- validate the whole taskboard before a Knot run starts
- use it as the main schema for editors, forms, and CI checks
- reserve top-level `metadata` for orchestration settings, not per-story business facts

## Project Spec Schema

`project-spec.schema.json` is the contract for the project-wide specification document.

Core rules:

- stable project identity and workflow roots live here
- style, workflow, review policy, and naming are first-class
- this file carries long-lived project constraints, not per-story execution state

Recommended use:

- validate `project-spec.json` before a Knot run starts
- let AI generate a draft `project-spec.generated.json`, then validate before promotion
- keep reusable editorial or production rules here
- avoid duplicating story-level data from `taskboard.json`

## Story Schema

`story.schema.json` is the contract for one executable story inside `taskboard.json`.

Core rules:

- one story produces one primary artifact set
- inputs and outputs are explicit
- dependencies use stable story IDs
- review policy is first-class
- `metadata` is for structured project-specific fields
- `extensions` is the escape hatch when the core model is not enough

Recommended use:

- validate each story before writing `taskboard.json`
- keep project-specific business fields in `metadata`
- avoid putting critical logic only in `extensions`

## Review Result Schema

`review-result.schema.json` is the contract for one stored review decision.

Core rules:

- every review belongs to one story
- every review has one review type
- findings justify the final status
- `decision.next_status` can drive orchestration
- stored results can be used for audit, retry, UI, and analytics

Recommended use:

- write one review file per gate or reviewer
- keep findings small and actionable
- use `code` for stable machine-readable issue categories

## Preflight Report Schema

`preflight-report.schema.json` is the contract for the persisted output of Knot's startup validation checks.

Core rules:

- every report is explicitly typed as `preflight`
- every check records the schema path, input path, and validation message
- the report has one overall `status`

Recommended use:

- persist startup validation outcomes for auditability
- inspect failures without rerunning the loop
- feed preflight results into dashboards or retry tooling

## Example Files

- Story examples live in [taskboard.json.example](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/taskboard.json.example:1)
- Review result example lives in [review-result.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/review-result.example.json:1)
- Preflight report example lives in [preflight-report.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/preflight-report.example.json:1)

## Practical Guidance

- validate `runtime/taskboard.json` against `taskboard.schema.json` first
- put workflow-specific routing in `metadata`
- keep `extensions` for rare exceptions, not normal modeling
- prefer new formal fields over freeform notes when a pattern repeats

## CLI Validation

Knot includes a simple CLI validator:

```bash
python knot/automation/scripts/validate_schema.py --schema knot/automation/schemas/taskboard.schema.json --input knot/runtime/taskboard.json
python knot/automation/scripts/validate_schema.py --schema knot/automation/schemas/project-spec.schema.json --input knot/examples/project-spec.example.json
python knot/automation/scripts/validate_schema.py --schema knot/automation/schemas/review-result.schema.json --input knot/examples/review-result.example.json
python knot/automation/scripts/validate_schema.py --schema knot/automation/schemas/preflight-report.schema.json --input knot/examples/preflight-report.example.json
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --force
```

Exit code behavior:

- `0` = valid
- `1` = schema validation failed
- `2` = file, parsing, or runtime error

For a persisted preflight report, use:

```bash
python knot/automation/scripts/run_preflight.py --knot-dir knot
```

That command writes:

- `runtime/reviews/preflight/latest.json`
- a `PRECHECK` entry in `runtime/progress.txt`
