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
3. Make sure `knot/examples/` still represent the current schema model.
4. Confirm `knot/runtime/` does not contain domain-specific project data.
5. Confirm domain examples live under `knot/examples/templates/`.
6. Make sure `knot/runtime/` only contains generic demo or starter files, not project-specific private data.
7. Review `.gitignore` so generated runtime outputs are not included by accident.
8. Move relevant `Unreleased` notes from `CHANGELOG.md` into a dated release section.

## Validation Commands

Run these commands from the repository root:

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/project-spec.schema.json \
  --input knot/examples/project-spec.example.json
```

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/review-result.schema.json \
  --input knot/examples/review-result.example.json
```

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/preflight-report.schema.json \
  --input knot/examples/preflight-report.example.json
```

```bash
python3 -m unittest discover -s knot/automation/tests
```

```bash
python3 knot/automation/scripts/run_preflight.py --knot-dir knot
```

## Release Review

Before publishing, verify these points manually:

- `knot/core/knot.sh` points at the current `knot/automation/`, `knot/runtime/`, and `knot/core/` paths
- `knot/core/CLAUDE.md` describes the current runtime file layout
- `docs/SCHEMAS.md` matches the actual schema files
- `docs/OPERATION_MANUAL.md` still matches the current commands
- `knot/examples/templates/` contains domain examples, and default `knot/runtime/` remains generic
- `skills/knot-runtime/` documents how to install the skill into `.agents/skills/` or `.claude/skills/`

## Packaging Notes

Keep these files in the release:

- `knot/`
- `docs/`
- `skills/knot-runtime/`
- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `RELEASING.md`
- `requirements.txt`

Keep `knot/runtime/` only as starter state. Do not publish project-specific review history or local scratch outputs.

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
