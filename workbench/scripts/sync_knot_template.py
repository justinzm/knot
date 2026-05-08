#!/usr/bin/env python3
"""Sync the repository Knot framework into the Tauri resource template."""

from __future__ import annotations

import shutil
from pathlib import Path


REQUIRED_RUNTIME_FILES = [
    "project-brief.md",
    "project-spec.json",
    "taskboard.json",
    "progress.txt",
]


def copy_tree(source: Path, destination: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Missing template source: {source}")
    shutil.copytree(source, destination)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    source_root = repo_root / "knot"
    target_root = repo_root / "workbench" / "src-tauri" / "resources" / "knot-template"
    starter = source_root / "examples" / "starter-empty"

    if target_root.exists():
        shutil.rmtree(target_root)
    target_root.mkdir(parents=True)

    copy_tree(source_root / "core", target_root / "core")
    copy_tree(source_root / "automation", target_root / "automation")
    copy_tree(starter, target_root / "examples" / "starter-empty")

    runtime_target = target_root / "runtime"
    runtime_target.mkdir()
    for filename in REQUIRED_RUNTIME_FILES:
        shutil.copy2(starter / filename, runtime_target / filename)

    print(f"Synced Knot template to {target_root}")


if __name__ == "__main__":
    main()
