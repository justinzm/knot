# Knot Studio Design

Date: 2026-05-03

## 1. Product Direction

Knot Studio is a local desktop workflow builder and execution console for small content studios.

The product turns the current Knot framework from a command-line and JSON-file workflow into a visual desktop tool. It lets users design content-production workflows, generate valid Knot runtime files, run preflight checks, start the Knot loop, and inspect outputs, reviews, and progress without hand-editing JSON.

The first version targets small content studios and teams that need repeatable content production workflows, review gates, and visible execution state. It does not try to become a full cloud collaboration suite in the first release.

## 2. Confirmed Decisions

- Product focus: generic workflow builder for content-production projects.
- Target user: content studios and small teams.
- Runtime shape: local desktop application.
- Execution scope: full local console, including workflow setup, preflight, loop execution, logs, outputs, and reviews.
- Technical direction: Tauri + React + Python/Knot Core.
- Persistence model: existing Knot runtime files remain the source of truth.
- First release scope: local-first MVP, not SaaS, not real-time collaboration.

## 3. Existing Knot Context

Knot currently provides a file-based autonomous loop framework for content production:

- `knot/runtime/project-brief.md` stores human-readable project intent.
- `knot/runtime/project-spec.json` stores stable project style, workflow, naming, and review policy.
- `knot/runtime/taskboard.json` stores executable stories, dependencies, inputs, outputs, statuses, and gate requirements.
- `knot/runtime/progress.txt` stores append-only production memory.
- `knot/runtime/reviews/*` stores preflight and story review results.
- `knot/automation/schemas/*.json` define the formal JSON contracts.
- `knot/automation/scripts/run_preflight.py` validates runtime files and writes preflight reports.
- `knot/core/knot.sh` runs the preflight gate and then loops through story execution.

The current user experience assumes familiarity with JSON, terminal commands, schemas, progress logs, and the runtime directory structure. Knot Studio should preserve the file-based contract while making these concepts visible and operable through a desktop UI.

## 4. Product Principles

1. Keep Knot file-native.
   Runtime files remain portable, inspectable, versionable, and executable outside the desktop app.

2. Make workflow structure visible.
   Users should see stages, stories, dependencies, gates, outputs, and blockers as UI objects rather than raw JSON fields.

3. Translate technical terms into studio language.
   A story is a reviewable content unit. A gate is a pass condition. Outputs are deliverables. Progress is production history.

4. Validate before writing.
   UI edits must be normalized and schema-validated before they are persisted to runtime files.

5. Keep execution auditable.
   Preflight results, loop logs, progress entries, review files, and outputs must be easy to inspect after success or failure.

6. Avoid cloud complexity in the first release.
   Accounts, organizations, billing, real-time collaboration, and hosted sync are outside the MVP.

## 5. High-Level Architecture

Knot Studio has three layers:

### 5.1 Desktop Shell

Tauri provides:

- native application window
- local project directory selection
- filesystem permissions
- command bridge between UI and local runtime
- local process control
- future packaging and distribution

### 5.2 Frontend UI

React provides:

- project setup flow
- brief/spec forms
- workflow graph
- taskboard and story inspector
- gate configuration
- validation center
- run console
- output/review/progress browser
- template selection

### 5.3 Knot Runtime Layer

The existing Knot framework provides:

- JSON schemas
- runtime files
- preflight script
- project spec generation script
- `knot.sh` loop runner
- review and progress artifacts

The first version should not replace the runtime with a database. If later versions add a database or sync service, it should mirror or index the runtime rather than silently replacing it.

## 6. MVP Modules

### 6.1 Project Setup

Users can open or create a local content project.

Required behavior:

- choose a local folder
- detect whether it contains a Knot root
- detect `runtime/` state
- classify missing, starter/demo, or existing runtime
- initialize from a starter template when needed
- show the active project and runtime status

### 6.2 Brief and Spec Editor

Users can define project-level intent and constraints without editing JSON.

Required behavior:

- edit `project-brief.md`
- edit project type, target medium, language, audience, style, stages, artifact roots, review policy, and naming
- validate `project-spec.json` against `project-spec.schema.json`
- optionally generate an initial spec from brief and scanned context when the AI CLI is available

### 6.3 Workflow Builder

Users can visually build the workflow.

Required behavior:

- show stages as a workflow row or lane structure
- show stories as cards or nodes
- show dependencies as connections
- allow creating, editing, deleting, and reordering stories
- allow dependency editing with cycle prevention
- keep the visual graph and `taskboard.json` in sync

### 6.4 Story Inspector

Users can edit one story at a time.

Required behavior:

- title, stage, description, priority, and status
- inputs and outputs
- dependencies
- acceptance criteria
- notes
- metadata and extensions as advanced fields
- inline validation errors mapped to schema fields

### 6.5 Gates and Reviews

Users can configure required review gates.

Required behavior:

- choose required gates from supported schema values: existence, structure, business, compliance, continuity, editorial, brand, custom
- configure reviewer roles
- configure max revision rounds
- configure blocking behavior
- configure expected review artifact paths
- inspect review result files after execution

### 6.6 Validation Center

Users can understand readiness before running.

Required behavior:

- validate `project-spec.json`
- validate `taskboard.json`
- detect missing input files unless produced by dependencies
- detect illegal absolute paths or parent traversal
- detect dependency cycles
- show errors by affected file, story, and field
- provide actionable messages instead of raw schema dumps where possible

### 6.7 Run Console

Users can run Knot locally from the app.

Required behavior:

- run preflight
- show preflight status and `runtime/reviews/preflight/latest.json`
- start the Knot loop
- prevent multiple active runs for the same runtime
- stream stdout/stderr logs
- allow stopping the loop process
- show completed, failed, and stopped states
- refresh taskboard, progress, reviews, and outputs after execution

### 6.8 Outputs Browser

Users can inspect what the workflow produced.

Required behavior:

- list expected outputs from the taskboard
- show whether each output exists
- preview Markdown, JSON, and text files
- list review artifacts
- show `progress.txt` in a readable chronological view

### 6.9 Templates

Users can start from reusable workflow shapes.

Required behavior for MVP:

- empty starter template
- generic content-production template
- ability to copy a template into the active runtime

Deferred template work:

- domain-specific template library
- gate presets by content type
- template marketplace
- online sharing

## 7. Data Model and File Flow

Runtime files are the canonical state. The app should use an internal runtime snapshot model derived from the files, but the files remain authoritative.

### 7.1 Core Runtime Files

- `runtime/project-brief.md`
- `runtime/project-spec.json`
- `runtime/taskboard.json`
- `runtime/progress.txt`
- `runtime/reviews/preflight/latest.json`
- story review artifacts declared in taskboard
- output artifacts declared in taskboard

### 7.2 Command Boundary

The Tauri command layer should expose stable operations:

- `loadRuntime`
- `saveProjectBrief`
- `saveProjectSpec`
- `saveTaskboard`
- `validateRuntime`
- `runPreflight`
- `startLoop`
- `stopLoop`
- `readProgress`
- `listReviews`
- `listOutputs`
- `readArtifact`

The frontend should not directly assemble arbitrary shell commands or write runtime files without going through this boundary.

### 7.3 Safe Save Flow

All structured runtime saves should follow this flow:

1. UI draft is converted to the canonical JSON shape.
2. Data is normalized.
3. Schema validation runs.
4. Existing file is backed up or recoverable.
5. File is written atomically.
6. Runtime snapshot is reloaded.
7. UI receives the fresh snapshot and validation state.

This prevents partial writes and keeps the visual editor aligned with the real runtime.

## 8. Execution State Machine

The run console should use an explicit state machine:

```text
idle -> validating -> preflight -> running -> completed
                                      |
                                      -> failed
                                      -> stopped
```

Rules:

- Only one active run is allowed per active runtime.
- Loop execution requires a passing preflight.
- Structural editing is disabled while the loop is running.
- Viewing logs, progress, reviews, and outputs remains available while running.
- Stopping a run should preserve logs and current runtime state.
- Non-zero exits must produce an inspectable failed state.
- If all stories complete and the loop emits `<promise>COMPLETE</promise>`, the run is marked completed.

## 9. User Experience

### 9.1 Main Navigation

The MVP should use a stable left navigation:

- Overview
- Project Brief
- Workflow Builder
- Taskboard
- Gate Rules
- Run Console
- Outputs
- Settings

### 9.2 Primary Layout

The Workflow Builder should use:

- left navigation for major sections
- top project/status bar
- central graph or stage canvas
- right inspector for the selected story
- bottom or side validation/log area when relevant

### 9.3 First-Use Path

1. User opens Knot Studio.
2. User selects or creates a local project folder.
3. App detects or initializes Knot runtime.
4. User chooses a blank or generic template.
5. User fills in brief/spec fields.
6. User creates and connects stories.
7. User configures gates.
8. App validates runtime.
9. User runs preflight.
10. User starts the loop.
11. User views generated outputs, reviews, and progress.

### 9.4 Daily Use Path

1. User opens a recent project.
2. Overview shows project readiness, next executable story, blockers, and latest run status.
3. User fixes missing inputs or failed gates.
4. User runs preflight.
5. User starts or continues the loop.
6. User reviews outputs and review artifacts.
7. User exports, commits, or shares the runtime outside the app if needed.

## 10. Error Handling

The app must make failure modes legible:

- Missing Knot root: explain what is missing and offer initialization.
- Invalid JSON: show the file and parse error location.
- Schema failure: map the error to the relevant field or story.
- Missing input path: show the affected story and input path.
- Dependency cycle: highlight the cycle in the graph.
- Preflight failure: show the failed check and link to `latest.json`.
- Missing AI CLI: show the selected tool and installation/switch guidance.
- Loop failure: preserve logs, show exit status, and refresh runtime state.
- External file changes: prompt to reload or compare before overwriting.

## 11. Testing Strategy

MVP testing should cover both the existing Knot scripts and the new desktop adapter layer.

Required test areas:

- runtime load/save preserves schema validity
- taskboard graph and JSON conversion are consistent
- dependency cycle detection works
- schema errors map to user-visible fields
- preflight command success and failure are parsed correctly
- loop process logging captures stdout and stderr
- stopping a loop process preserves logs
- outputs/reviews/progress browsers read expected files
- app handles missing Python, missing AI CLI, and missing runtime files

Existing Python `unittest` coverage should remain in place for the framework scripts. New app code should have focused tests around file adapters, command handlers, validation mapping, and graph conversion.

## 12. Phase Roadmap

### Phase 1: Local MVP

Goal: local desktop workflow builder and execution console.

Deliverables:

- Tauri desktop shell
- React application shell
- project picker and runtime discovery
- runtime adapter
- schema validation integration
- brief/spec/taskboard forms
- workflow graph and story inspector
- gate rules editor
- validation center
- preflight integration
- loop process console
- output/review/progress browser

Acceptance standard:

From a blank local directory, a user can create a Knot runtime, build at least three dependent stories, pass schema validation and preflight, start a Knot loop, and inspect output files, review files, and progress records inside the app.

### Phase 2: Template System

Goal: make workflow setup faster and more reusable.

Deliverables:

- richer template library
- workflow duplication
- gate presets
- guided setup wizard
- improved output and review previews
- runtime backup/diff history

### Phase 3: Studio Team Layer

Goal: support small-team operating practices without losing local-first portability.

Possible deliverables:

- review assignment
- exportable status reports
- asset indexing
- shared project conventions
- packaged releases
- optional sync backend

Cloud accounts, billing, and real-time collaboration remain out of scope until the local product proves useful.

## 13. Phase 1 Delivery Slices

1. App shell, project picker, and runtime discovery.
2. Runtime adapter, schema validation, and safe save.
3. Brief/spec/taskboard forms.
4. Workflow graph and story inspector.
5. Gate rules editor and validation center.
6. Preflight command integration.
7. Loop process console and logs.
8. Outputs, reviews, and progress browser.

Each slice should be independently verifiable before moving to the next one.

## 14. Deferred Scope

The following are intentionally excluded from the MVP:

- cloud accounts
- organization management
- billing
- real-time multi-user editing
- hosted database-backed runtime
- full digital asset management
- publishing platform integrations
- analytics dashboards
- commercial template marketplace

These may become later phases, but they should not block the first local desktop version.

## 15. Open Product Risks

1. A generic builder can feel abstract.
   Mitigation: ship with at least one generic content-production template and strong first-use guidance.

2. Tauri + Python sidecar packaging can be complex.
   Mitigation: keep the command boundary narrow and preserve the ability to run Knot scripts externally.

3. Editing visual graph and JSON can drift.
   Mitigation: use one canonical adapter and reload the runtime snapshot after every save.

4. Loop execution can mutate files while UI is open.
   Mitigation: disable structural edits during runs and refresh runtime state after process events.

5. Existing runtime files may represent valuable production work.
   Mitigation: detect existing runtimes, classify them, and require explicit replacement or backup before overwriting.

## 16. Final Design Summary

Knot Studio should be built as a local desktop application for content studios that need to design and execute repeatable content workflows. The first release should focus on a complete local loop: create or open a project, build a valid workflow, configure gates, run preflight, start the Knot loop, and inspect outputs and reviews.

The design keeps the current Knot framework intact. Runtime files remain the source of truth, while the desktop app provides a visual and safer interface over those files and scripts. This gives users a much more intuitive operating experience without sacrificing the portability and auditability that make Knot useful.
