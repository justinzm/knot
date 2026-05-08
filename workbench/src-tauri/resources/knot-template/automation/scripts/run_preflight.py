#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    from validate_schema import validate_json
except ImportError:  # pragma: no cover - package import fallback
    from .validate_schema import validate_json


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def append_progress(progress_path: Path, checks: list[dict[str, str]], overall_status: str) -> None:
    lines = [
        f"## [{utc_now()}] - PRECHECK",
        f"- Status: {overall_status}",
        "- Checks:",
    ]
    for item in checks:
        lines.append(f"  - {item['name']}: {item['status']}")
    lines.append(f"- Report: reviews/preflight/latest.json")
    lines.append("---")

    existing = progress_path.read_text(encoding="utf-8") if progress_path.exists() else ""
    with progress_path.open("a", encoding="utf-8") as fh:
        if existing and not existing.endswith("\n"):
            fh.write("\n")
        fh.write("\n".join(lines))
        fh.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Knot schema preflight checks and persist the results.")
    parser.add_argument("--knot-dir", required=True, help="Path to the Knot directory.")
    return parser.parse_args()


def build_check(name: str, schema_path: Path, input_path: Path) -> dict[str, str]:
    valid, message = validate_json(schema_path, input_path)
    return {
        "name": name,
        "status": "pass" if valid else "fail",
        "schema": str(schema_path),
        "input": str(input_path),
        "message": message,
    }


def main() -> int:
    args = parse_args()
    knot_dir = Path(args.knot_dir).resolve()

    progress_path = knot_dir / "runtime" / "progress.txt"
    report_path = knot_dir / "runtime" / "reviews" / "preflight" / "latest.json"
    taskboard_path = knot_dir / "runtime" / "taskboard.json"
    taskboard_schema_path = knot_dir / "automation" / "schemas" / "taskboard.schema.json"
    project_spec_path = knot_dir / "runtime" / "project-spec.json"
    project_spec_schema_path = knot_dir / "automation" / "schemas" / "project-spec.schema.json"

    checks = [
        build_check("taskboard", taskboard_schema_path, taskboard_path)
    ]

    if project_spec_path.exists():
        checks.append(build_check("project-spec", project_spec_schema_path, project_spec_path))

    overall_status = "pass" if all(item["status"] == "pass" for item in checks) else "fail"

    report = {
        "report_type": "preflight",
        "created_at": utc_now(),
        "status": overall_status,
        "checks": checks,
    }

    ensure_parent(report_path)
    report_path.write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
    append_progress(progress_path, checks, overall_status)

    if overall_status == "pass":
        print(f"PRECHECK PASS: {report_path}")
        return 0

    print(f"PRECHECK FAIL: {report_path}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
