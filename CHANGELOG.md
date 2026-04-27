# Changelog

All notable changes to `Knot` should be recorded in this file.

This project follows a simple keep-a-changelog style adapted for workflow and schema driven tooling.

## Unreleased

### Added

- Placeholder for new features, documents, schemas, scripts, or examples.

### Changed

- Placeholder for behavior changes, path changes, workflow changes, or onboarding updates.

### Fixed

- Placeholder for bug fixes, validation fixes, or documentation corrections.

### Removed

- Placeholder for deleted skills, deprecated files, or obsolete workflow paths.

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
