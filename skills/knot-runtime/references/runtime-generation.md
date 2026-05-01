# Runtime Generation Reference

Use this reference when creating Knot runtime files.

## Minimal File Set

```text
runtime/project-brief.md
runtime/project-spec.json
runtime/taskboard.json
runtime/progress.txt
```

## Story Template

```json
{
  "id": "ST-001",
  "title": "Create outline",
  "stage": "outline",
  "description": "Produce one reviewable content artifact.",
  "priority": 1,
  "status": "ready",
  "inputs": [
    "runtime/project-brief.md",
    "runtime/project-spec.json"
  ],
  "outputs": [
    "artifacts/example/outline.md"
  ],
  "dependencies": [],
  "acceptance_criteria": [
    "Expected artifact exists and is non-empty",
    "Structure validation passes",
    "Business review passes",
    "Compliance review passes"
  ],
  "review_policy": {
    "required_gates": [
      "existence",
      "structure",
      "business",
      "compliance"
    ],
    "reviewers": [
      "content-reviewer"
    ],
    "max_revision_rounds": 2,
    "blocking": true,
    "review_artifacts": [
      "runtime/reviews/ST-001-business.json",
      "runtime/reviews/ST-001-compliance.json"
    ]
  },
  "notes": "",
  "metadata": {},
  "extensions": {}
}
```

## Gate Selection

- `existence`: file present and non-empty.
- `structure`: schema, headings, required fields, naming, ordering.
- `business`: content quality, usefulness, project-specific quality bar.
- `compliance`: platform, policy, brand safety, legal/sensitive-content checks.
- `continuity`: cross-artifact consistency.
- `editorial`: grammar, clarity, tone, publishing readiness.
- `brand`: brand voice and brand constraints.
- `custom`: only when the above are insufficient; describe it in `acceptance_criteria`.

## Project-Specific Skill Scan

When a project has content-production skills, extract:

- production stages
- source file conventions
- expected artifact structure
- review roles
- review gates
- compliance constraints
- naming conventions
- examples of completed outputs

Then encode stable rules in `project-spec.json` and executable units in `taskboard.json`.

## Ready Definition

A Knot project is ready to run when:

- all four runtime files exist
- `project-spec.json` validates
- `taskboard.json` validates
- every external input file exists
- output parent directories are writable or creatable
- `python3` can import `jsonschema`
- selected AI CLI is available
- preflight passes
