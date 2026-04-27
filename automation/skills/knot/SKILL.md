---
name: knot
description: "Build a Knot taskboard from a content workflow spec."
user-invocable: true
---

# Knot Taskboard Builder

Use this skill when you have a content production process and want to convert it into a Knot-compatible `runtime/taskboard.json`.

## What Knot Needs

Knot does not require a PRD.

It requires:

- a project spec
- small executable stories
- clear artifact paths
- explicit review gates

## Output

Create or update `runtime/taskboard.json` with:

- `project`
- `workflow`
- `description`
- `stories`

Each story must include:

- `id`
- `title`
- `stage`
- `description`
- `priority`
- `status`
- `inputs`
- `outputs`
- `dependencies`
- `acceptance_criteria`
- `review_policy`
- `notes`
- `metadata`
- `extensions`

## Story Design Rules

- One story = one reviewable content unit
- One story = one primary artifact
- Stories must be completable in one iteration
- Dependencies must flow forward only
- Gates must be explicit and testable

## Recommended Status Values

- `todo`
- `ready`
- `in_progress`
- `in_review`
- `needs_revision`
- `blocked`
- `done`

## Recommended Gate Values

- `existence`
- `structure`
- `business`
- `compliance`

## Final Check

Before saving:

- ensure every story is small enough
- ensure file paths are explicit
- ensure ordering is dependency-safe
- ensure review policy matches the artifact type
