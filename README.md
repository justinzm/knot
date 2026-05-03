# Knot

**English** | [简体中文](README.zh-CN.md)

Knot is an autonomous loop framework for content production workflows.

It is built for projects where work needs to be split into small, reviewable units, carried across many iterations, and approved through explicit gates instead of vague "looks done" judgment.

The default loop is:

`produce -> validate -> review -> revise -> approve -> persist`

## What Knot Keeps

- One story per iteration
- Fresh context every iteration
- Append-only progress memory
- Automatic looping until the taskboard is complete

## What Knot Changes

Knot does not assume software delivery.

Instead of:

- story = coding task
- quality gate = typecheck, lint, test
- done = passing code change

Knot assumes:

- story = smallest reviewable content unit
- quality gate = validation + review + compliance
- done = artifact written, approved, and state persisted

## Good Fit

Knot works well for:

- script and episode pipelines
- storyboard and prompt generation
- editorial calendars
- campaign asset production
- podcast and course production
- worldbuilding and lore systems

It is a weaker fit for fully open-ended ideation with no review boundary.

## Project Layout

- `knot/`
  The Knot framework directory to copy into a host content project.
- `knot/core/`
  Runtime entrypoints such as `knot.sh` and the iteration prompt.
- `knot/automation/`
  Schemas, validation scripts, and tests.
- `knot/runtime/`
  Minimal generic demo runtime that can pass preflight and show the loop shape without binding Knot to a specific production domain.
- `knot/examples/starter-empty/`
  Copyable starter files for a new Knot runtime.
- `knot/examples/templates/`
  Optional domain templates such as `seedance-short-drama`.
- `skills/knot-runtime/`
  Optional agent skill source to copy into `.agents/skills/` or `.claude/skills/`.
- `studio/`
  Optional local desktop application for visually building and running Knot workflows.
- `docs/`
  Operator guide and schema reference.

## Use Knot In A Content Project

Recommended layout:

```text
my-content-project/
├── .agents/ or .claude/       # optional, where agent skills are installed
├── knot/                      # copied from this repository's knot/ directory
├── config.json                # host project configuration, optional
├── script/                    # source material
├── assets/                    # shared facts, references, or media metadata
└── outputs/                   # generated content artifacts
```

Knot should usually live as `./knot` inside the host project. Copy this repository's `knot/` directory to the host project as `./knot`. The host project owns the source material and generated outputs; `knot/runtime/` owns the current taskboard, project spec, and progress memory.

To make the included runtime-preparation skill available to an agent, copy it into the agent's skill search path:

```bash
mkdir -p .agents/skills
cp -R /path/to/knot-package/skills/knot-runtime .agents/skills/knot-runtime
```

For Claude Code projects:

```bash
mkdir -p .claude/skills
cp -R /path/to/knot-package/skills/knot-runtime .claude/skills/knot-runtime
```

## Start Here

1. Run preflight against the generic demo runtime in `knot/runtime/`.
2. Inspect `knot/runtime/taskboard.json` to see how stories, dependencies, outputs, and gates are modeled.
3. For a new project, copy `knot/examples/starter-empty/` into `knot/runtime/` and fill in the brief, spec, and taskboard.
4. For a domain-specific example, inspect `knot/examples/templates/seedance-short-drama/`.
5. Start `knot/core/knot.sh` when the runtime files represent the project you want to run.

Useful entrypoints:

- Operator guide: [docs/OPERATION_MANUAL.md](docs/OPERATION_MANUAL.md)
- Schema reference: [docs/SCHEMAS.md](docs/SCHEMAS.md)
- Release guide: [RELEASING.md](RELEASING.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- 中文概览: [README.zh-CN.md](README.zh-CN.md)

## Quick Commands

Install the Python dependency:

```bash
python3 -m pip install -r requirements.txt
```

From this repository root:

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

```bash
python3 knot/automation/scripts/run_preflight.py --knot-dir knot
```

```bash
./knot/core/knot.sh
```

From inside the `knot/` framework directory, omit the first `knot/` prefix:

```bash
cd knot

python3 automation/scripts/validate_schema.py \
  --schema automation/schemas/taskboard.schema.json \
  --input runtime/taskboard.json

python3 automation/scripts/run_preflight.py --knot-dir .
```

### Knot Studio desktop app

```bash
cd studio
npm install
npm run tauri dev
```

## Templates

Templates are examples, not Knot core behavior.

- `knot/examples/starter-empty/`: a schema-valid blank starter for a new content workflow.
- `knot/examples/templates/seedance-short-drama/`: a 30-episode short-drama workflow that produces director analysis, art/scene prompt facts, and Seedance 2.0 storyboard prompts.

The Seedance template includes `knot/examples/templates/seedance-short-drama/knot-init/`, a template-specific initializer. The generic Knot framework does not assume episode scripts, short-drama stages, or Seedance prompts.

## Agent Skill

The generic runtime-preparation skill is shipped as source in `skills/knot-runtime/`. Keeping it there makes the release self-contained, but that path is not automatically loaded by most agents.

Install it into the host project when you want an agent to prepare or refresh `knot/runtime/` from the host project's materials:

- Codex-style agents: `.agents/skills/knot-runtime/`
- Claude Code: `.claude/skills/knot-runtime/`

The skill should generate or update only:

- `knot/runtime/project-brief.md`
- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

## Core Inputs

Knot does not require a PRD.

The minimum operating set is:

- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

`knot/runtime/project-spec.json` can be generated by AI from `knot/runtime/project-brief.md` plus scanned project context, or written manually against the schema.
