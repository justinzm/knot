#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


REQUIRED_RUNTIME_FILES = [
    "project-brief.md",
    "project-spec.json",
    "taskboard.json",
    "progress.txt",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check whether a Knot runtime is ready to run.")
    parser.add_argument("--knot-dir", required=True, help="Path to the Knot directory.")
    parser.add_argument("--runtime-dir", help="Runtime directory. Defaults to <knot-dir>/runtime.")
    parser.add_argument(
        "--host-root",
        help="Host project root for non-runtime inputs and outputs. Defaults to the current directory when it contains the Knot directory, otherwise <knot-dir>.",
    )
    parser.add_argument("--tool", choices=["claude", "amp"], default="claude", help="AI CLI to check.")
    parser.add_argument("--run-preflight", action="store_true", help="Run Knot preflight when runtime-dir is canonical.")
    return parser.parse_args()


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def check_jsonschema() -> tuple[bool, str]:
    result = subprocess.run(
        [sys.executable, "-c", "import jsonschema"],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return True, "python jsonschema import: pass"
    return False, "python jsonschema import: fail"


def check_ai_cli(tool: str) -> tuple[bool, str]:
    tool_path = shutil.which(tool)
    if not tool_path:
        return False, f"AI CLI {tool}: missing"
    result = subprocess.run(
        [tool_path, "--version"],
        text=True,
        capture_output=True,
        timeout=15,
        check=False,
    )
    if result.returncode == 0:
        version = (result.stdout or result.stderr).strip().splitlines()
        suffix = f" ({version[0]})" if version else ""
        return True, f"AI CLI {tool}: pass {tool_path}{suffix}"
    return False, f"AI CLI {tool}: found at {tool_path} but --version failed"


def determine_host_root(knot_dir: Path, host_root_arg: str | None) -> Path:
    if host_root_arg:
        return Path(host_root_arg).resolve()

    cwd = Path.cwd().resolve()
    if cwd == knot_dir:
        return knot_dir

    try:
        if knot_dir.relative_to(cwd).parts:
            return cwd
    except ValueError:
        pass

    return knot_dir


def run_validator(knot_dir: Path, schema: str, input_path: Path) -> tuple[bool, str]:
    script = knot_dir / "automation" / "scripts" / "validate_schema.py"
    schema_path = knot_dir / "automation" / "schemas" / schema
    result = subprocess.run(
        [sys.executable, str(script), "--schema", str(schema_path), "--input", str(input_path)],
        text=True,
        capture_output=True,
        check=False,
    )
    output = (result.stdout or result.stderr).strip()
    return result.returncode == 0, output


def input_is_dependency_output(taskboard: dict[str, object], story_id: str, input_path: str) -> bool:
    stories = taskboard.get("stories", [])
    if not isinstance(stories, list):
        return False
    story_by_id = {story.get("id"): story for story in stories if isinstance(story, dict)}
    story = story_by_id.get(story_id)
    if not isinstance(story, dict):
        return False
    deps = story.get("dependencies", [])
    if not isinstance(deps, list):
        return False
    for dep_id in deps:
        dep = story_by_id.get(dep_id)
        if not isinstance(dep, dict):
            continue
        outputs = dep.get("outputs", [])
        if isinstance(outputs, list) and input_path in outputs:
            return True
    return False


def check_inputs(knot_dir: Path, host_root: Path, taskboard: dict[str, object]) -> list[str]:
    problems: list[str] = []
    stories = taskboard.get("stories", [])
    if not isinstance(stories, list):
        return ["taskboard stories is not a list"]
    for story in stories:
        if not isinstance(story, dict):
            continue
        story_id = str(story.get("id", "<unknown>"))
        inputs = story.get("inputs", [])
        if not isinstance(inputs, list):
            problems.append(f"{story_id}: inputs is not a list")
            continue
        for input_path in inputs:
            if not isinstance(input_path, str):
                problems.append(f"{story_id}: non-string input {input_path!r}")
                continue
            if (knot_dir / input_path).exists() or (host_root / input_path).exists():
                continue
            if input_is_dependency_output(taskboard, story_id, input_path):
                continue
            problems.append(f"{story_id}: missing input {input_path}")
    return problems


def check_outputs(knot_dir: Path, host_root: Path, taskboard: dict[str, object]) -> list[str]:
    problems: list[str] = []
    stories = taskboard.get("stories", [])
    if not isinstance(stories, list):
        return ["taskboard stories is not a list"]
    for story in stories:
        if not isinstance(story, dict):
            continue
        story_id = str(story.get("id", "<unknown>"))
        outputs = story.get("outputs", [])
        if not isinstance(outputs, list):
            problems.append(f"{story_id}: outputs is not a list")
            continue
        for output_path in outputs:
            if not isinstance(output_path, str):
                problems.append(f"{story_id}: non-string output {output_path!r}")
                continue
            parent = (knot_dir / output_path).parent
            if not str(output_path).startswith("runtime/"):
                parent = (host_root / output_path).parent
            try:
                parent.mkdir(parents=True, exist_ok=True)
            except OSError as exc:
                problems.append(f"{story_id}: cannot create output parent for {output_path}: {exc}")
    return problems


def main() -> int:
    args = parse_args()
    knot_dir = Path(args.knot_dir).resolve()
    runtime_dir = Path(args.runtime_dir).resolve() if args.runtime_dir else knot_dir / "runtime"
    host_root = determine_host_root(knot_dir, args.host_root)

    failures: list[str] = []
    for filename in REQUIRED_RUNTIME_FILES:
        path = runtime_dir / filename
        if path.exists():
            print(f"runtime file: pass {path}")
        else:
            failures.append(f"runtime file: missing {path}")

    ok, message = check_jsonschema()
    print(message)
    if not ok:
        failures.append(message)

    ok, message = check_ai_cli(args.tool)
    print(message)
    if not ok:
        failures.append(message)

    taskboard_path = runtime_dir / "taskboard.json"
    project_spec_path = runtime_dir / "project-spec.json"
    if project_spec_path.exists():
        ok, output = run_validator(knot_dir, "project-spec.schema.json", project_spec_path)
        print(output)
        if not ok:
            failures.append(output)
    if taskboard_path.exists():
        ok, output = run_validator(knot_dir, "taskboard.schema.json", taskboard_path)
        print(output)
        if not ok:
            failures.append(output)
        else:
            taskboard = load_json(taskboard_path)
            if isinstance(taskboard, dict):
                failures.extend(check_inputs(knot_dir, host_root, taskboard))
                failures.extend(check_outputs(knot_dir, host_root, taskboard))

    if args.run_preflight:
        canonical_runtime = (knot_dir / "runtime").resolve()
        if runtime_dir != canonical_runtime:
            failures.append("preflight skipped: runtime-dir is not <knot-dir>/runtime")
        else:
            preflight = knot_dir / "automation" / "scripts" / "run_preflight.py"
            result = subprocess.run(
                [sys.executable, str(preflight), "--knot-dir", str(knot_dir)],
                text=True,
                capture_output=True,
                check=False,
            )
            print((result.stdout or result.stderr).strip())
            if result.returncode != 0:
                failures.append("preflight: fail")

    if failures:
        print("\nNOT READY")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nREADY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
