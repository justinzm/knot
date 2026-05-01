# Changelog

All notable changes to `Knot` should be recorded in this file.

This project follows a simple keep-a-changelog style adapted for workflow and schema driven tooling.

## Unreleased

### Added

- Added `skills/knot-runtime/` as the packaged source location for the optional Knot runtime-preparation skill.
- Added install instructions for copying the runtime skill into `.agents/skills/` or `.claude/skills/`.
- Added `requirements.txt` for the Python validation dependency.

### Changed

- Moved the framework files under a top-level `knot/` directory so the repository root can serve as a release package containing both `knot/` and `skills/`.
- Clarified the recommended host-project layout where Knot is vendored as `./knot`.
- Updated release validation commands to run correctly from the repository root.

### Fixed

- Fixed documentation ambiguity around skill source location versus active agent skill installation location.

### Removed

- Removed the duplicate `automation/skills/knot` skill entry.

## 2026-04-24

### Added

- Introduced `Knot` as a generic autonomous loop for content production workflows.
- Added formal schemas for `project-spec`, `taskboard`, `story`, `review result`, and `preflight report`.
- Added schema validation tooling and preflight reporting.
- Added English and Chinese project overviews.
- Added a detailed operator manual and schema reference.
- Added release documentation and runtime ignore rules.

### Changed

- Reframed the system from a coding-oriented loop into a content-production loop.
- Reorganized the `knot/` directory into `core/`, `automation/`, `docs/`, `examples/`, and `runtime/`.
- Updated paths, scripts, tests, and documentation to match the new structure.
- Simplified the root READMEs into landing-page style entry documents.

### Removed

- Removed the old `prd` skill from the active project setup.

## Changelog Rules

When updating this file:

- Add new changes to `Unreleased` first.
- Group entries under `Added`, `Changed`, `Fixed`, and `Removed` when possible.
- Prefer user-visible changes over internal implementation trivia.
- Mention schema, runtime contract, and workflow changes explicitly.
- Move `Unreleased` items into a dated section when cutting a release.
