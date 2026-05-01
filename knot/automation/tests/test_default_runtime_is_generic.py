import json
import importlib.util
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[3]
KNOT_DIR = ROOT / "knot"
SKILL_DIR = ROOT / "skills" / "knot-runtime"

CHECK_READY_PATH = SKILL_DIR / "scripts" / "check_knot_ready.py"
CHECK_READY_SPEC = importlib.util.spec_from_file_location("check_knot_ready", CHECK_READY_PATH)
assert CHECK_READY_SPEC is not None
check_knot_ready = importlib.util.module_from_spec(CHECK_READY_SPEC)
assert CHECK_READY_SPEC.loader is not None
CHECK_READY_SPEC.loader.exec_module(check_knot_ready)


class DefaultRuntimeIsGenericTests(unittest.TestCase):
    def test_default_runtime_does_not_reference_seedance(self) -> None:
        paths = [
            KNOT_DIR / "runtime" / "project-brief.md",
            KNOT_DIR / "runtime" / "project-spec.json",
            KNOT_DIR / "runtime" / "taskboard.json",
        ]
        combined = "\n".join(path.read_text(encoding="utf-8") for path in paths)

        blocked_terms = [
            "Seedance",
            "seedance",
            "ai-shot-team-seedance",
            "短剧",
            "导演分析",
            "服化道",
            "分镜",
            "Episode-01",
            "ep01",
        ]
        for term in blocked_terms:
            self.assertNotIn(term, combined)

    def test_default_runtime_is_tiny_demo(self) -> None:
        taskboard = json.loads((KNOT_DIR / "runtime" / "taskboard.json").read_text(encoding="utf-8"))

        self.assertEqual(taskboard["project"], "knot-generic-demo")
        self.assertEqual(len(taskboard["stories"]), 2)
        self.assertEqual(taskboard["stories"][0]["id"], "ST-001")
        self.assertEqual(taskboard["stories"][1]["dependencies"], ["ST-001"])

    def test_seedance_template_is_preserved_outside_runtime(self) -> None:
        template_dir = KNOT_DIR / "examples" / "templates" / "seedance-short-drama"

        self.assertTrue((template_dir / "project-brief.md").exists())
        self.assertTrue((template_dir / "project-spec.json").exists())
        self.assertTrue((template_dir / "taskboard.json").exists())

    def test_runtime_skill_is_packaged_under_skills(self) -> None:
        self.assertTrue((SKILL_DIR / "SKILL.md").exists())
        self.assertTrue((SKILL_DIR / "README.md").exists())
        self.assertFalse((ROOT / "knot-skill").exists())
        self.assertFalse((KNOT_DIR / "automation" / "skills" / "knot" / "SKILL.md").exists())

    def test_check_ready_uses_knot_dir_as_host_when_run_from_knot_root(self) -> None:
        with mock.patch("pathlib.Path.cwd", return_value=KNOT_DIR):
            host_root = check_knot_ready.determine_host_root(KNOT_DIR, None)

        self.assertEqual(host_root, KNOT_DIR)

    def test_check_ready_uses_current_directory_when_it_contains_knot_dir(self) -> None:
        with mock.patch("pathlib.Path.cwd", return_value=ROOT):
            host_root = check_knot_ready.determine_host_root(KNOT_DIR, None)

        self.assertEqual(host_root, ROOT)


if __name__ == "__main__":
    unittest.main()
