---
name: knot-runtime
description: Use when a user wants to prepare, initialize, refresh, replace, or verify a Knot runtime for a content-production project, especially when runtime files, taskboard stories, project briefs/specs, or preflight readiness are involved.
---

# Knot Skill

## Overview

Prepare a content-production project to run under Knot without inheriting stale assumptions from prior runtimes, examples, or previous conversations. The job is to build or refresh the runtime files from the current user's goal and the current project's evidence, then verify that Knot can execute them.

## Core Principle

Treat `runtime/` as mutable project state, not disposable scratch. Before replacing it, identify whether it is empty/demo state, an existing production run, or a different project. Preserve history unless the user explicitly authorizes a reset.

## Required Inputs

Identify these before writing:

- Knot root: directory containing `core/`, `automation/`, and `runtime/`.
- Host project root: the parent or workspace that contains the user's content instructions and source material. This may be the Knot root, or the parent directory when Knot is nested as `knot/`.
- Target runtime directory: user-specified path, or `<knot-root>/runtime`.
- User goal: content to produce, source materials, outputs, style, review gates, and any requested reset/refresh behavior.
- Content-production instructions: project prompts, skills, templates, examples, config, source folders, and existing runtime state.

If the target directory is outside the writable workspace, request permission before writing.

## Contamination Guard

Do not reuse domain facts from an existing runtime, template, example, or prior conversation unless they are supported by the current user request or current project files.

When scanning, separate evidence into:

- `framework evidence`: Knot docs, schemas, runner behavior, validation scripts.
- `host project evidence`: current content skills, prompts, source inputs, templates, config, user notes.
- `old runtime evidence`: existing `runtime/` files that may belong to a previous run.
- `example evidence`: templates and examples that illustrate shape but are not the user's project.

Only `host project evidence` and explicit user instructions should define the new content workflow. Use `framework evidence` for structure and validation. Use `old runtime evidence` only for refresh/continuation or for safety summaries. Use `example evidence` only as shape guidance.

## Existing Runtime Safety Gate

Before writing runtime files, inspect the current target runtime if it exists:

- Read `runtime/project-spec.json`, `runtime/taskboard.json`, `runtime/project-brief.md`, `runtime/progress.txt`, and `runtime/reviews/preflight/latest.json` when present.
- Summarize the existing runtime identity:
  - project id/name
  - workflow/type
  - story count
  - status counts
  - whether progress contains more than initialization/preflight
  - whether reviews or artifacts already exist
- Classify the runtime:
  - `empty`: missing or starter-like files with no meaningful history.
  - `demo`: generic example runtime, no project-specific source material, no meaningful history.
  - `production`: project-specific runtime, multiple stories, existing progress history, reviews, artifacts, or a project id that differs from the new goal.

If classification is `production` and the user has not clearly asked to overwrite or reset:

1. Stop before editing.
2. Report the existing runtime summary.
3. Ask whether to archive/replace, refresh in place, or choose another target runtime directory.

If the user explicitly asks to replace a production runtime, archive the previous runtime state first when possible:

- Archive at least `project-brief.md`, `project-spec.json`, `taskboard.json`, `progress.txt`, `reviews/`, and known artifact roots.
- Use a path such as `runtime/archive/<date>-<old-project-id>/`.
- If archiving cannot be done safely, report why before proceeding.

## Project Reading Order

Read only what is needed, but perform this scan before designing stories:

1. Knot framework files in the Knot root:
   - `README.md`, `README.zh-CN.md`, `docs/OPERATION_MANUAL.md`, `docs/SCHEMAS.md`
   - `AGENTS.md`, `CLAUDE.md`, `core/CLAUDE.md`, `core/PROJECT_SPEC_GENERATOR.md`
   - `automation/schemas/*.json`
2. Host project instructions in the Knot root and host project root:
   - `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `.agents/AGENTS.md`
   - `skills/**/SKILL.md`
   - `.claude/skills/**/SKILL.md`
   - `.agents/skills/**/SKILL.md`
3. Templates and examples:
   - `examples/templates/**/SKILL.md`
   - template runtime files only when they match the user's requested domain or are needed for schema shape.
4. User source folders mentioned in the request, plus obvious roots:
   - `script/`, `source/`, `sources/`, `inputs/`, `assets/`, `facts/`, `outputs/`, `content/`, `docs/`
5. Existing target `runtime/*` files for refresh, continuation, or safety classification.

Use `rg --files` and targeted reads. Summarize large source sets instead of loading every file.

## Missing Goal Handling

If the user did not provide enough detail to define a workflow:

- If host project instructions clearly define the content type, stages, outputs, style, and templates, infer a conservative runtime from those instructions and mark any default creative seed or placeholder as replaceable in `project-brief.md`.
- If host project instructions are absent or ambiguous, ask for the minimum missing details before writing:
  - target content/output
  - source material
  - expected artifact structure
  - review gates or quality bar

Do not invent project-specific facts from the repository name alone.

## Runtime Files To Generate

Generate or update exactly these files in the target runtime directory:

- `project-brief.md`
- `project-spec.json`
- `taskboard.json`
- `progress.txt`

Keep taskboard paths project-relative to the Knot root. Do not use absolute paths or `../` in taskboard inputs/outputs.

### External References

If essential host project instructions live outside the Knot root:

- Do not put `../` paths in `taskboard.json`.
- Prefer summarizing stable rules into `project-brief.md`, `project-spec.metadata`, or `project-spec.extensions`.
- If exact files are needed during Knot iterations, copy only the needed reference files into a project-relative reference directory such as `runtime/reference/`, then cite those copied paths in taskboard inputs.
- Do not copy large source sets unless the user asks; summarize or reference source roots that are inside the Knot root.

### project-brief.md

Include:

- Goal
- Inputs
- Outputs
- Source material summary
- Style requirements
- Review requirements
- Constraints and exclusions
- Any inferred defaults, clearly labeled as defaults and replaceable

Make this readable by both humans and AI reviewers.

### project-spec.json

Must satisfy `automation/schemas/project-spec.schema.json`.

Set:

- stable `project_id`
- content-oriented `project_type`
- `target_medium`
- `language`
- `audience`
- `style.voice`, `style.visual_style`, `style.tone`
- `workflow.stages`
- `workflow.artifact_root`, `workflow.fact_root`, `workflow.review_root`
- `review_policy.required_gates`
- `naming.story_prefix`, `naming.artifact_convention`

Use `metadata` for structured project facts and `extensions` for non-core workflow details. Keep the spec domain-neutral unless current project evidence supplies domain-specific facts.

### taskboard.json

Must satisfy `automation/schemas/taskboard.schema.json`.

Story design rules:

- One story = one reviewable content unit.
- Each story has explicit `inputs`, `outputs`, `dependencies`, `acceptance_criteria`, and `review_policy`.
- `priority` orders executable work.
- `dependencies` only reference earlier story IDs.
- Use `ready` for the first executable story and `todo` for downstream stories unless refreshing an existing board.
- Required gates usually include `existence`, `structure`, `business`, `compliance`; add `continuity`, `editorial`, or `brand` only when justified by the content workflow.
- Prefer small batches over large omnibus stories.

When refreshing an existing runtime, preserve story status and progress only if the user is continuing the same project. If the runtime identity changes, treat it as replacement and apply the safety gate first.

### progress.txt

For a genuinely new runtime:

```text
# Knot Progress Log
Initialized: <ISO-8601 timestamp>
---
```

For an existing production runtime:

- Append; do not rewrite history unless the user explicitly asks to reset.
- If reconfiguring in place, append a `RUNTIME_RECONFIG` entry describing what changed.
- If replacing after archive, initialize the new progress log and note the archive path when practical.

## Validation Workflow

After writing the runtime files, verify in this order:

1. Input files exist:
   - Every taskboard `inputs[]` path exists unless it is an output of a dependency story.
2. Taskboard paths are legal:
   - No absolute paths.
   - No parent traversal (`../`).
   - No platform-specific drive paths.
3. Output locations are writable or creatable:
   - Parent directories either exist or can be created.
   - Do not create final artifacts.
   - Avoid creating empty directories solely for Git visibility; if you create them, report that empty directories may not be tracked.
4. Python/jsonschema works:
   - `python3 -c "import jsonschema"`
5. AI CLI works:
   - Determine the default tool from `core/knot.sh`, not from memory or README prose.
   - Run `<tool> --version` for the selected/default tool (`claude` or `amp`).
6. Schema validation:
   - `python3 automation/scripts/validate_schema.py --schema automation/schemas/project-spec.schema.json --input <runtime>/project-spec.json`
   - `python3 automation/scripts/validate_schema.py --schema automation/schemas/taskboard.schema.json --input <runtime>/taskboard.json`
7. Deterministic readiness script:
   - If `scripts/check_knot_ready.py` or `automation/scripts/check_knot_ready.py` exists, run it.
   - If no readiness script exists, explicitly say it was not available and use the checks above as the fallback.
8. Preflight:
   - If target runtime is `<knot-root>/runtime`, run `python3 automation/scripts/run_preflight.py --knot-dir <knot-root>`.
   - If target runtime is elsewhere, either copy/swap into `<knot-root>/runtime` for preflight with user approval or report that preflight requires the canonical runtime path.

## Failure Handling

- Missing source inputs: stop and list exact missing paths.
- Existing production runtime without overwrite permission: stop and ask for archive/replace/refresh direction.
- Missing `jsonschema`: install only with user approval; otherwise report the command needed.
- Missing AI CLI: report which tool is missing and how the user can choose another supported tool.
- Schema failure: fix the runtime JSON and rerun validation.
- Preflight failure: read `runtime/reviews/preflight/latest.json`, fix root cause, rerun.

Do not claim the project is ready unless schema validation and preflight pass, or clearly state which verification could not be run and why.

## Useful Commands

From Knot root:

```bash
python3 automation/scripts/validate_schema.py --schema automation/schemas/project-spec.schema.json --input runtime/project-spec.json
python3 automation/scripts/validate_schema.py --schema automation/schemas/taskboard.schema.json --input runtime/taskboard.json
python3 automation/scripts/run_preflight.py --knot-dir .
./core/knot.sh --tool claude 20
```

Read `references/runtime-generation.md` for a compact checklist and examples when available.

## Pressure Scenarios

Use these scenarios to evaluate future edits to this skill:

- Existing runtime has many project-specific stories and progress history; a new request asks for a different runtime. The agent must stop and ask before overwrite.
- Knot is nested under a host project; content instructions live in the parent directory. The agent must find host instructions without putting `../` paths in taskboard inputs.
- Existing runtime is a generic demo with no meaningful history. The agent may replace it after summarizing the classification.
- Required readiness helper is missing. The agent must use fallback checks and avoid claiming the missing helper ran.
- User gives only a broad runtime setup request. The agent must infer only from project evidence or ask for missing details.
