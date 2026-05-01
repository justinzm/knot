#!/usr/bin/env python3
"""
Knot Project Initializer

Automated initialization for Knot content-production projects.

Functions:
1. Clean existing runtime state (optional)
2. Scan project structure (scripts, config, existing artifacts)
3. Generate project-brief.md
4. Generate taskboard.json
5. Generate progress.txt
6. Call official generate_project_spec.py for project-spec.json
7. Run preflight validation

Usage:
    python init_project.py --knot-dir knot [--clean] [--tool claude]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# ── Episode number extraction patterns ──────────────────────────────

EPISODE_PATTERNS = [
    re.compile(r'(?:^|[^\w])ep(?:isode)?[-_]?(\d+)', re.I),
    re.compile(r'(?:^|[^\w])第(\d+)集', re.I),
]

STAGE_DEFINITIONS = [
    {
        "stage_id": "director-analysis",
        "short": "DIR",
        "title_prefix": "导演分析",
        "agent": "director",
        "outputs": ["outputs/{episode}/01-director-analysis.md"],
    },
    {
        "stage_id": "art-design",
        "short": "ART",
        "title_prefix": "服化道设计",
        "agent": "art-designer",
        "outputs": ["assets/character-prompts.json", "assets/scene-prompts.json"],
    },
    {
        "stage_id": "storyboard-prompting",
        "short": "SB",
        "title_prefix": "分镜编写",
        "agent": "storyboard-artist",
        "outputs": ["outputs/{episode}/02-seedance-prompts.json"],
    },
]


# ── Helpers ─────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize a Knot project runtime."
    )
    parser.add_argument(
        "--knot-dir", required=True, help="Path to the Knot directory."
    )
    parser.add_argument(
        "--project-root",
        help="Project root directory. Defaults to parent of knot-dir.",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove existing runtime files before initialization.",
    )
    parser.add_argument(
        "--skip-spec",
        action="store_true",
        help="Skip generating project-spec.json.",
    )
    parser.add_argument(
        "--tool",
        default="claude",
        choices=["claude", "amp"],
        help="AI CLI tool for spec generation.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without writing files.",
    )
    parser.add_argument(
        "--max-episodes",
        type=int,
        default=50,
        help="Maximum number of episodes to include in taskboard.",
    )
    return parser.parse_args()


def extract_episode_number(filename: str) -> int | None:
    """Extract episode number from filename."""
    for pattern in EPISODE_PATTERNS:
        match = pattern.search(filename)
        if match:
            return int(match.group(1))
    # Fallback: try any standalone number
    numbers = re.findall(r'\d+', filename)
    if numbers:
        return int(numbers[0])
    return None


def episode_id(num: int) -> str:
    """Format episode ID like ep01, ep02."""
    return f"ep{num:02d}"


def read_config(project_root: Path) -> dict[str, Any]:
    """Read config.json if it exists."""
    config_path = project_root / "config.json"
    if config_path.exists():
        try:
            with config_path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def scan_scripts(project_root: Path, max_episodes: int) -> list[dict[str, Any]]:
    """Scan script/ directory for episode files."""
    script_dir = project_root / "script"
    if not script_dir.exists():
        return []

    episodes: list[dict[str, Any]] = []
    for entry in sorted(script_dir.iterdir()):
        if not entry.is_file():
            continue
        # Skip hidden files and common non-script extensions
        if entry.name.startswith("."):
            continue
        ext = entry.suffix.lower()
        if ext not in (".md", ".txt", ".json", ""):
            continue

        num = extract_episode_number(entry.name)
        if num is None:
            continue
        if num > max_episodes:
            continue

        episodes.append({
            "number": num,
            "id": episode_id(num),
            "filename": entry.name,
            "path": f"script/{entry.name}",
        })

    # Sort by episode number
    episodes.sort(key=lambda e: e["number"])
    return episodes


def scan_existing_outputs(project_root: Path) -> dict[str, dict[str, bool]]:
    """Check which episodes already have outputs."""
    outputs_dir = project_root / "outputs"
    result: dict[str, dict[str, bool]] = {}
    if not outputs_dir.exists():
        return result

    for ep_dir in outputs_dir.iterdir():
        if not ep_dir.is_dir():
            continue
        ep_match = re.match(r'^ep(\d+)$', ep_dir.name, re.I)
        if not ep_match:
            continue
        ep = f"ep{int(ep_match.group(1)):02d}"
        result[ep] = {
            "has_director": (ep_dir / "01-director-analysis.md").exists(),
            "has_storyboard": (ep_dir / "02-seedance-prompts.json").exists(),
        }
    return result


def clean_runtime(runtime_dir: Path, dry_run: bool) -> None:
    """Remove existing runtime files."""
    files_to_remove = [
        "taskboard.json",
        "project-brief.md",
        "project-spec.json",
        "progress.txt",
        ".last-run-key",
    ]
    dirs_to_remove = ["reviews"]

    for name in files_to_remove:
        path = runtime_dir / name
        if path.exists():
            if dry_run:
                print(f"[DRY-RUN] Would remove: {path}")
            else:
                path.unlink()
                print(f"Removed: {path}")

    for name in dirs_to_remove:
        path = runtime_dir / name
        if path.exists():
            if dry_run:
                print(f"[DRY-RUN] Would remove directory: {path}")
            else:
                shutil.rmtree(path)
                print(f"Removed directory: {path}")


def generate_brief(
    runtime_dir: Path,
    project_info: dict[str, Any],
    dry_run: bool,
) -> None:
    """Generate project-brief.md."""
    config = project_info["config"]
    episodes = project_info["episodes"]
    existing = project_info["existing_outputs"]

    visual_style = config.get("visual_style", "[待填写：视觉风格]")
    target_medium = config.get("target_medium", "[待填写：目标媒介]")
    target_duration = config.get("episode_target_duration_seconds", 60)
    tolerance = config.get("episode_duration_tolerance_seconds", 4)

    episode_count = len(episodes)
    completed = sum(
        1 for ep in existing.values()
        if ep.get("has_storyboard")
    )

    lines = [
        "# 项目需求\n",
        "## 目标\n",
        f"将 {episode_count} 集剧本转化为可直接用于 Seedance 2.0 的视频生成提示词。\n" if episode_count > 0 else "将剧本转化为 Seedance 2.0 视频提示词。\n",
    ]

    lines.extend([
        "## 输入\n",
        f"- {episode_count} 集剧本（script/ 目录下）\n" if episode_count > 0 else "- 剧本文件（script/ 目录下）\n",
        f"- 项目配置 config.json（视觉风格：{visual_style}，目标媒介：{target_medium}，时长预算：{target_duration}秒±{tolerance}秒）\n",
    ])

    if completed > 0:
        lines.append(f"- 已有 {completed} 集完成全部产出\n")

    lines.extend([
        "## 输出\n",
        "- 每集导演分析（outputs/epXX/01-director-analysis.md）\n",
        "- 人物和场景提示词（assets/character-prompts.json, assets/scene-prompts.json）\n",
        "- Seedance 2.0 视频提示词（outputs/epXX/02-seedance-prompts.json）\n",
        "\n",
        "## 风格要求\n",
        f"- 视觉风格：{visual_style}\n",
        f"- 目标媒介：{target_medium}\n",
        f"- 每集时长：{target_duration}秒 ± {tolerance}秒\n",
        "\n",
        "## 审核要求\n",
        "- 业务审核：叙事结构、讲戏质量、运镜合理性、Seedance 2.0 规范合规\n",
        "- 合规审核：平台内容政策（无真人限制、无版权IP、无政治敏感、无极端暴力）\n",
    ])

    content = "".join(lines)
    brief_path = runtime_dir / "project-brief.md"

    if dry_run:
        print(f"[DRY-RUN] Would write: {brief_path}")
        print(content)
        return

    brief_path.write_text(content, encoding="utf-8")
    print(f"Generated: {brief_path}")


def generate_taskboard(
    runtime_dir: Path,
    project_info: dict[str, Any],
    dry_run: bool,
) -> None:
    """Generate taskboard.json with proper story definitions."""
    episodes = project_info["episodes"]

    if not episodes:
        print("WARNING: No episodes found in script/. Taskboard will be empty.")

    # Derive project name from directory
    project_root = project_info["project_root"]
    project_name = slugify(project_root.name)

    stories: list[dict[str, Any]] = []
    priority = 1

    for ep in episodes:
        ep_id = ep["id"]
        ep_num = ep["number"]
        script_path = ep["path"]
        prev_stage_id: str | None = None

        for stage_def in STAGE_DEFINITIONS:
            stage_id = stage_def["stage_id"]
            short = stage_def["short"]
            story_id = f"EP{ep_num:02d}-{short}"

            # Build inputs
            if stage_id == "director-analysis":
                inputs = [script_path, "config.json"]
            elif stage_id == "art-design":
                inputs = [f"outputs/{ep_id}/01-director-analysis.md", "config.json"]
            else:  # storyboard-prompting
                inputs = [
                    f"outputs/{ep_id}/01-director-analysis.md",
                    "assets/character-prompts.json",
                    "assets/scene-prompts.json",
                    "config.json",
                ]

            # Build outputs
            outputs = [o.format(episode=ep_id) for o in stage_def["outputs"]]

            # Build dependencies
            dependencies: list[str] = []
            if prev_stage_id:
                dependencies.append(prev_stage_id)

            story = {
                "id": story_id,
                "title": f"{stage_def['title_prefix']} EP{ep_num:02d}",
                "stage": stage_id,
                "description": f"{stage_def['title_prefix']} for {ep_id}",
                "priority": priority,
                "status": "todo",
                "inputs": inputs,
                "outputs": outputs,
                "dependencies": dependencies,
                "acceptance_criteria": [
                    f"{outputs[0].split('/')[-1]} exists and is non-empty",
                    "Structure validation passes",
                    "Business review passes",
                    "Compliance review passes",
                ],
                "review_policy": {
                    "required_gates": ["existence", "structure", "business", "compliance"],
                    "reviewers": [stage_def["agent"]],
                    "max_revision_rounds": 2,
                    "blocking": True,
                    "review_artifacts": [
                        f"runtime/reviews/{story_id}-business.json",
                        f"runtime/reviews/{story_id}-compliance.json",
                    ],
                },
                "notes": "",
                "metadata": {
                    "episode": ep_id,
                    "artifact_type": stage_id,
                },
            }
            stories.append(story)
            prev_stage_id = story_id
            priority += 1

    taskboard = {
        "project": project_name,
        "workflow": "content-production",
        "description": f"{project_name}: {len(episodes)}-episode content production pipeline",
        "stories": stories,
    }

    taskboard_path = runtime_dir / "taskboard.json"

    if dry_run:
        print(f"[DRY-RUN] Would write: {taskboard_path}")
        print(json.dumps(taskboard, ensure_ascii=False, indent=2))
        return

    taskboard_path.write_text(
        json.dumps(taskboard, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Generated: {taskboard_path} ({len(stories)} stories)")


def generate_progress(runtime_dir: Path, dry_run: bool) -> None:
    """Generate initial progress.txt."""
    now = datetime.now(timezone.utc).isoformat()
    content = (
        "# Knot Progress Log\n"
        f"Initialized: {now}\n"
        "---\n"
    )
    progress_path = runtime_dir / "progress.txt"

    if dry_run:
        print(f"[DRY-RUN] Would write: {progress_path}")
        return

    progress_path.write_text(content, encoding="utf-8")
    print(f"Generated: {progress_path}")


def generate_project_spec(
    knot_dir: Path,
    tool: str,
    dry_run: bool,
) -> bool:
    """Call official generate_project_spec.py."""
    script_path = knot_dir / "automation" / "scripts" / "generate_project_spec.py"
    if not script_path.exists():
        print(f"WARNING: Spec generator not found at {script_path}")
        return False

    cmd = [
        sys.executable,
        str(script_path),
        "--knot-dir", str(knot_dir),
        "--tool", tool,
        "--force",
    ]

    if dry_run:
        print(f"[DRY-RUN] Would run: {' '.join(cmd)}")
        return True

    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode == 0


def run_preflight(knot_dir: Path, dry_run: bool) -> bool:
    """Run preflight validation."""
    script_path = knot_dir / "automation" / "scripts" / "run_preflight.py"
    if not script_path.exists():
        print(f"WARNING: Preflight script not found at {script_path}")
        return False

    cmd = [sys.executable, str(script_path), "--knot-dir", str(knot_dir)]

    if dry_run:
        print(f"[DRY-RUN] Would run: {' '.join(cmd)}")
        return True

    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode == 0


def ensure_runner_executable(knot_dir: Path, dry_run: bool) -> None:
    """Ensure the copied Knot runner can be invoked as ./core/knot.sh."""
    runner_path = knot_dir / "core" / "knot.sh"
    if not runner_path.exists():
        print(f"WARNING: Knot runner not found at {runner_path}")
        return

    if dry_run:
        print(f"[DRY-RUN] Would chmod +x: {runner_path}")
        return

    runner_path.chmod(0o755)
    print(f"Ensured executable: {runner_path}")


def slugify(value: str) -> str:
    """Convert string to kebab-case slug."""
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


# ── Main ────────────────────────────────────────────────────────────

def main() -> int:
    args = parse_args()
    knot_dir = Path(args.knot_dir).resolve()
    project_root = (
        Path(args.project_root).resolve()
        if args.project_root
        else knot_dir.parent
    )
    runtime_dir = knot_dir / "runtime"

    print(f"Knot directory: {knot_dir}")
    print(f"Project root: {project_root}")
    print()

    # Ensure runtime directory exists
    if not dry_run_check(args.dry_run, f"Create directory: {runtime_dir}"):
        runtime_dir.mkdir(parents=True, exist_ok=True)

    ensure_runner_executable(knot_dir, args.dry_run)
    print()

    # 1. Clean existing runtime (optional)
    if args.clean:
        print("=== Cleaning existing runtime ===")
        clean_runtime(runtime_dir, args.dry_run)
        print()

    # 2. Scan project structure
    print("=== Scanning project structure ===")
    config = read_config(project_root)
    episodes = scan_scripts(project_root, args.max_episodes)
    existing = scan_existing_outputs(project_root)

    print(f"  Config: visual_style={config.get('visual_style', 'N/A')}, "
          f"target_medium={config.get('target_medium', 'N/A')}")
    print(f"  Episodes found: {len(episodes)}")
    if existing:
        print(f"  Existing outputs: {len(existing)} episodes")
    print()

    project_info = {
        "project_root": project_root,
        "config": config,
        "episodes": episodes,
        "existing_outputs": existing,
    }

    # 3. Generate project-brief.md
    print("=== Generating project-brief.md ===")
    generate_brief(runtime_dir, project_info, args.dry_run)
    print()

    # 4. Generate taskboard.json
    print("=== Generating taskboard.json ===")
    generate_taskboard(runtime_dir, project_info, args.dry_run)
    print()

    # 5. Generate progress.txt
    print("=== Generating progress.txt ===")
    generate_progress(runtime_dir, args.dry_run)
    print()

    # 6. Generate project-spec.json
    if not args.skip_spec:
        print("=== Generating project-spec.json ===")
        spec_ok = generate_project_spec(knot_dir, args.tool, args.dry_run)
        if not spec_ok and not args.dry_run:
            print("WARNING: project-spec generation failed. You may need to run it manually.")
        print()
    else:
        print("=== Skipping project-spec.json generation ===")
        print()

    # 7. Run preflight
    print("=== Running preflight ===")
    preflight_ok = run_preflight(knot_dir, args.dry_run)
    print()

    # Summary
    print("=" * 60)
    print("Initialization Summary")
    print("=" * 60)
    print(f"  Episodes:      {len(episodes)}")
    print(f"  Stories:       {len(episodes) * 3}")
    print(f"  Project:       {slugify(project_root.name)}")
    print(f"  Runtime dir:   {runtime_dir}")
    print()

    if args.dry_run:
        print("This was a DRY RUN. No files were written.")
        print("Remove --dry-run to execute.")
        return 0

    if preflight_ok:
        print("Preflight PASSED. You can now start Knot:")
        print(f"  ./knot/core/knot.sh --tool {args.tool}")
    else:
        print("Preflight had issues. Check the output above.")
        print("You may need to fix taskboard.json or project-spec.json manually.")

    # Missing config warnings
    missing = []
    if not config.get("visual_style"):
        missing.append("visual_style")
    if not config.get("target_medium"):
        missing.append("target_medium")
    if missing:
        print()
        print(f"WARNING: config.json is missing: {', '.join(missing)}")
        print("Please update config.json before running Knot.")

    return 0 if preflight_ok else 1


def dry_run_check(dry_run: bool, action: str) -> bool:
    """Print dry-run message and return whether to skip execution."""
    if dry_run:
        print(f"[DRY-RUN] Would: {action}")
        return True
    return False


if __name__ == "__main__":
    raise SystemExit(main())
