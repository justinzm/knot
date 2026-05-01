import tempfile
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from knot.automation.scripts.generate_project_spec import (
    build_cli_command,
    build_prompt,
    collect_project_context,
    extract_json_payload,
    slugify,
)


class GenerateProjectSpecTests(unittest.TestCase):
    def test_extract_json_payload_accepts_fenced_json(self) -> None:
        payload = extract_json_payload(
            "```json\n{\"project_id\":\"demo\",\"project_type\":\"content\",\"target_medium\":\"video\",\"language\":\"zh-CN\",\"audience\":\"general\",\"style\":{\"voice\":\"clear\",\"visual_style\":\"cinematic\",\"tone\":\"controlled\"},\"workflow\":{\"stages\":[\"analysis\"],\"artifact_root\":\"outputs/\",\"fact_root\":\"assets/\",\"review_root\":\"reviews/\"},\"review_policy\":{\"required_gates\":[\"structure\"],\"notes\":\"test\"},\"naming\":{\"story_prefix\":\"ST\",\"artifact_convention\":\"stable paths\"}}\n```"
        )
        self.assertEqual(payload["project_id"], "demo")

    def test_slugify_returns_machine_friendly_id(self) -> None:
        self.assertEqual(slugify("Content Ops Demo"), "content-ops-demo")

    def test_collect_project_context_mentions_key_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            knot_dir = root / "knot"
            (root / ".claude").mkdir(parents=True)
            (root / "assets").mkdir()
            (root / "outputs").mkdir()
            (root / "script").mkdir()
            (knot_dir / "runtime").mkdir(parents=True)
            (root / ".claude" / "CLAUDE.md").write_text("producer workflow", encoding="utf-8")
            (knot_dir / "runtime" / "taskboard.json").write_text(
                '{"project":"demo","workflow":"content","description":"x","stories":[]}',
                encoding="utf-8",
            )
            (knot_dir / "runtime" / "progress.txt").write_text("# log", encoding="utf-8")

            context = collect_project_context(knot_dir, root)

        self.assertIn(".claude/CLAUDE.md", context)
        self.assertIn("knot/runtime/taskboard.json", context)
        self.assertIn("assets:", context)

    def test_build_prompt_includes_brief_and_context(self) -> None:
        prompt = build_prompt("RULES", "Need a content workflow", "PROJECT CONTEXT")
        self.assertIn("Need a content workflow", prompt)
        self.assertIn("PROJECT CONTEXT", prompt)

    def test_build_cli_command_wraps_powershell_script_on_windows(self) -> None:
        with mock.patch("knot.automation.scripts.generate_project_spec.os.name", "nt"), \
             mock.patch("knot.automation.scripts.generate_project_spec.shutil.which") as which_mock:
            which_mock.side_effect = [
                r"C:\Users\EDY\AppData\Roaming\npm\claude.ps1",
                r"C:\Program Files\PowerShell\7\pwsh.exe",
            ]
            command = build_cli_command("claude")

        self.assertEqual(command[0], r"C:\Program Files\PowerShell\7\pwsh.exe")
        self.assertIn("-File", command)
        self.assertIn(r"C:\Users\EDY\AppData\Roaming\npm\claude.ps1", command)


if __name__ == "__main__":
    unittest.main()
