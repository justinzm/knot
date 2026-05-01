# Knot Runtime Skill

This directory contains the optional `knot-runtime` agent skill that prepares a host content project to run with Knot.

Keeping the skill here makes the Knot release self-contained, but this directory is only source material. Most agents will not automatically load a skill from the release package's `skills/knot-runtime/` directory.

## Install

From the host project root, after Knot has been copied or added as `./knot`:

```bash
mkdir -p .agents/skills
cp -R /path/to/knot-package/skills/knot-runtime .agents/skills/knot-runtime
```

For Claude Code:

```bash
mkdir -p .claude/skills
cp -R /path/to/knot-package/skills/knot-runtime .claude/skills/knot-runtime
```

## Expected Host Layout

```text
my-content-project/
├── .agents/ or .claude/
├── knot/
├── config.json
├── script/
├── assets/
└── outputs/
```

The host project owns source material and output artifacts. Knot owns the runtime state under `knot/runtime/`.

## What The Skill Does

Use this skill when you want an agent to prepare, refresh, replace, or verify a Knot runtime for a content-production project.

It should generate or update:

- `knot/runtime/project-brief.md`
- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

It also checks for stale or production runtime state before replacing files, so existing progress is not overwritten by accident.

## Example Prompt

```text
Use the Knot runtime skill to prepare this project for Knot. Read the source material in script/, use config.json as the project configuration, create a taskboard with one reviewable content unit per story, and run preflight when ready.
```

## Readiness Check

After runtime files are generated, the helper script can run deterministic checks:

```bash
python3 .agents/skills/knot-runtime/scripts/check_knot_ready.py --knot-dir knot --run-preflight
```

Use `.claude/skills/...` instead if the skill was installed for Claude Code.
