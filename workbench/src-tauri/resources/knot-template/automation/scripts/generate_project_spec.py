#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path, PurePath

try:
    from validate_schema import validate_json
except ImportError:  # pragma: no cover - package import fallback
    from .validate_schema import validate_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Knot project-spec.json from a brief and scanned project context."
    )
    parser.add_argument("--knot-dir", required=True, help="Path to the Knot directory.")
    parser.add_argument("--tool", default="claude", choices=["claude", "amp"], help="AI CLI to use.")
    parser.add_argument("--brief", help="Inline project brief text.")
    parser.add_argument(
        "--brief-file",
        help="Path to a project brief file. Defaults to runtime/project-brief.md when present.",
    )
    parser.add_argument(
        "--context-root",
        help="Project root to scan. Defaults to the parent directory of the Knot directory.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Also write the generated result to runtime/project-spec.json.",
    )
    return parser.parse_args()


def read_text(path: Path, max_chars: int = 8000) -> str:
    text = path.read_text(encoding="utf-8")
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n...[truncated]"


def slugify(value: str) -> str:
    pieces: list[str] = []
    last_dash = False
    for char in value.lower():
        if char.isalnum():
            pieces.append(char)
            last_dash = False
        elif not last_dash:
            pieces.append("-")
            last_dash = True
    slug = "".join(pieces).strip("-")
    return slug or "knot-project"


def find_brief_text(knot_dir: Path, args: argparse.Namespace) -> str:
    if args.brief:
        return args.brief.strip()

    if args.brief_file:
        brief_path = Path(args.brief_file).resolve()
        if brief_path.exists():
            return brief_path.read_text(encoding="utf-8").strip()

    default_brief = knot_dir / "runtime" / "project-brief.md"
    if default_brief.exists():
        return default_brief.read_text(encoding="utf-8").strip()

    return ""


def summarize_directory(path: Path, label: str, limit: int = 20) -> str:
    if not path.exists():
        return f"{label}: missing"
    if not path.is_dir():
        return f"{label}: not-a-directory"

    children = sorted(item.name + ("/" if item.is_dir() else "") for item in path.iterdir())
    preview = children[:limit]
    suffix = "" if len(children) <= limit else f" ... ({len(children) - limit} more)"
    return f"{label}: " + ", ".join(preview) + suffix


def summarize_file(path: Path, label: str, max_chars: int = 6000) -> str:
    if not path.exists():
        return f"{label}: missing"
    return f"{label}:\n```text\n{read_text(path, max_chars=max_chars)}\n```"


def collect_project_context(knot_dir: Path, context_root: Path) -> str:
    rel = lambda p: os.path.relpath(p, context_root).replace("\\", "/")

    lines = [
        f"Project root: {context_root}",
        f"Knot root: {knot_dir}",
        "",
        summarize_file(context_root / ".claude" / "CLAUDE.md", rel(context_root / ".claude" / "CLAUDE.md")),
        "",
        summarize_file(context_root / "config.json", rel(context_root / "config.json"), max_chars=3000),
        "",
        summarize_directory(context_root / "script", rel(context_root / "script")),
        summarize_directory(context_root / "assets", rel(context_root / "assets")),
        summarize_directory(context_root / "outputs", rel(context_root / "outputs")),
        "",
        summarize_file(knot_dir / "runtime" / "taskboard.json", rel(knot_dir / "runtime" / "taskboard.json")),
        "",
        summarize_file(knot_dir / "runtime" / "progress.txt", rel(knot_dir / "runtime" / "progress.txt"), max_chars=3000),
    ]
    return "\n".join(lines).strip()


def build_prompt(generator_instructions: str, brief_text: str, context_text: str) -> str:
    brief_block = brief_text.strip() if brief_text.strip() else "No explicit brief was provided. Infer cautiously from the scanned project context."
    return (
        f"{generator_instructions.strip()}\n\n"
        "## User Brief\n\n"
        f"{brief_block}\n\n"
        "## Scanned Project Context\n\n"
        f"{context_text.strip()}\n"
    )


def build_cli_command(tool: str) -> list[str]:
    resolved = shutil.which(tool)
    if not resolved:
        raise RuntimeError(f"{tool} command not found in PATH")

    resolved_path = PurePath(resolved)
    suffix = resolved_path.suffix.lower()

    if os.name == "nt" and suffix == ".ps1":
        shell_path = shutil.which("pwsh") or shutil.which("powershell")
        if not shell_path:
            raise RuntimeError(f"{tool} resolves to a PowerShell script, but no pwsh/powershell executable was found")

        if tool == "claude":
            return [shell_path, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolved, "--dangerously-skip-permissions", "--print"]
        return [shell_path, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolved, "--dangerously-allow-all"]

    if tool == "claude":
        return [resolved, "--dangerously-skip-permissions", "--print"]
    return [resolved, "--dangerously-allow-all"]


def run_model(tool: str, prompt: str) -> str:
    cmd = build_cli_command(tool)
    result = subprocess.run(
        cmd,
        input=prompt,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"{tool} returned {result.returncode}")

    output = (result.stdout or "").strip()
    if not output:
        raise RuntimeError(f"{tool} returned empty output")
    return output


def extract_json_payload(text: str) -> dict[str, object]:
    stripped = text.strip()

    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()

    try:
        payload = json.loads(stripped)
    except json.JSONDecodeError:
        start = stripped.find("{")
        if start == -1:
            raise ValueError("Model output did not contain a JSON object") from None
        depth = 0
        in_string = False
        escaped = False
        end = None
        for index, char in enumerate(stripped[start:], start=start):
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = index + 1
                    break

        if end is None:
            raise ValueError("Model output contained an incomplete JSON object") from None

        payload = json.loads(stripped[start:end])

    if not isinstance(payload, dict):
        raise ValueError("Model output must be a JSON object")
    return payload


def ensure_defaults(payload: dict[str, object], context_root: Path) -> dict[str, object]:
    if not payload.get("project_id"):
        payload["project_id"] = slugify(context_root.name)
    return payload


def main() -> int:
    args = parse_args()
    knot_dir = Path(args.knot_dir).resolve()
    context_root = Path(args.context_root).resolve() if args.context_root else knot_dir.parent

    generator_prompt_path = knot_dir / "core" / "PROJECT_SPEC_GENERATOR.md"
    schema_path = knot_dir / "automation" / "schemas" / "project-spec.schema.json"
    generated_path = knot_dir / "runtime" / "project-spec.generated.json"
    final_path = knot_dir / "runtime" / "project-spec.json"

    brief_text = find_brief_text(knot_dir, args)
    generator_instructions = generator_prompt_path.read_text(encoding="utf-8")
    context_text = collect_project_context(knot_dir, context_root)
    prompt = build_prompt(generator_instructions, brief_text, context_text)

    try:
        model_output = run_model(args.tool, prompt)
        payload = ensure_defaults(extract_json_payload(model_output), context_root)
    except Exception as exc:
        print(f"ERROR: failed to generate project spec: {exc}", file=sys.stderr)
        return 2

    generated_path.parent.mkdir(parents=True, exist_ok=True)
    generated_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    valid, message = validate_json(schema_path, generated_path)
    if not valid:
        print(message, file=sys.stderr)
        return 1

    if args.force:
        final_path.write_text(generated_path.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"GENERATED: {generated_path}")
        print(f"WROTE: {final_path}")
        return 0

    print(f"GENERATED: {generated_path}")
    print("Draft only. Re-run with --force to write runtime/project-spec.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
