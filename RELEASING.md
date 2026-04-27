# Releasing Knot

This guide is for preparing a clean `Knot` release as a reusable content-automation package.

## Release Goal

A release should ship:

- working runtime entrypoints
- valid schemas
- valid example files
- up-to-date docs
- no accidental runtime noise

## Pre-Release Checklist

1. Confirm the folder layout still matches the published docs.
2. Check that `README.md`, `README.zh-CN.md`, and `docs/` agree on paths and commands.
3. Make sure `examples/` still represent the current schema model.
4. Make sure `runtime/` only contains starter files, not project-specific private data.
5. Review `.gitignore` so generated runtime outputs are not included by accident.
6. Move relevant `Unreleased` notes from `CHANGELOG.md` into a dated release section.

## Validation Commands

Run these commands from the repository root:

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/project-spec.schema.json \
  --input knot/examples/project-spec.example.json
```

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/review-result.schema.json \
  --input knot/examples/review-result.example.json
```

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/preflight-report.schema.json \
  --input knot/examples/preflight-report.example.json
```

```bash
python -m unittest \
  knot.automation.tests.test_validate_schema \
  knot.automation.tests.test_run_preflight \
  knot.automation.tests.test_knot_preflight
```

```bash
python knot/automation/scripts/run_preflight.py --knot-dir knot
```

## Release Review

Before publishing, verify these points manually:

- `core/knot.sh` points at the current `automation/`, `runtime/`, and `core/` paths
- `core/CLAUDE.md` describes the current runtime file layout
- `docs/SCHEMAS.md` matches the actual schema files
- `docs/OPERATION_MANUAL.md` still matches the current commands
- `automation/skills/knot/SKILL.md` reflects the current taskboard model

## Packaging Notes

Keep these files in the release:

- `core/`
- `automation/`
- `examples/`
- `docs/`
- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `RELEASING.md`

Keep `runtime/` only as starter state. Do not publish project-specific review history or local scratch outputs.

## Recommended Versioning Rhythm

Use a new release when one of these changes happens:

- schema changes
- taskboard model changes
- runtime contract changes
- new validation or preflight behavior
- meaningful documentation or onboarding improvements

## Final Sanity Check

A release is ready when:

- the validation commands pass
- the unit tests pass
- preflight passes
- both READMEs point to the right docs
- `CHANGELOG.md` reflects the release contents
- no generated runtime output is staged by mistake
