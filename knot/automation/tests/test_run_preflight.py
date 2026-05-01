import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
KNOT_DIR = ROOT / "knot"
SCRIPT = KNOT_DIR / "automation" / "scripts" / "run_preflight.py"


class RunPreflightTests(unittest.TestCase):
    def run_cli(self, knot_dir: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--knot-dir",
                str(knot_dir),
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )

    def test_valid_preflight_writes_report_and_progress(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_knot = Path(tmp_dir) / "knot"
            shutil.copytree(KNOT_DIR, temp_knot)
            shutil.copyfile(
                temp_knot / "examples" / "project-spec.example.json",
                temp_knot / "runtime" / "project-spec.json",
            )

            result = self.run_cli(temp_knot)

            self.assertEqual(result.returncode, 0, result.stderr)

            report_path = temp_knot / "runtime" / "reviews" / "preflight" / "latest.json"
            self.assertTrue(report_path.exists())

            report = json.loads(report_path.read_text(encoding="utf-8"))
            self.assertEqual(report["status"], "pass")
            self.assertEqual(len(report["checks"]), 2)
            self.assertEqual(report["report_type"], "preflight")

            progress_text = (temp_knot / "runtime" / "progress.txt").read_text(encoding="utf-8")
            self.assertIn("PRECHECK", progress_text)
            self.assertIn("taskboard: pass", progress_text)
            self.assertIn("project-spec: pass", progress_text)

    def test_invalid_taskboard_fails_and_records_report(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_knot = Path(tmp_dir) / "knot"
            shutil.copytree(KNOT_DIR, temp_knot)

            (temp_knot / "runtime" / "taskboard.json").write_text(
                json.dumps(
                    {
                        "project": "broken-demo",
                        "workflow": "content-production",
                        "description": "Missing stories"
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_cli(temp_knot)

            self.assertNotEqual(result.returncode, 0)

            report_path = temp_knot / "runtime" / "reviews" / "preflight" / "latest.json"
            self.assertTrue(report_path.exists())

            report = json.loads(report_path.read_text(encoding="utf-8"))
            self.assertEqual(report["status"], "fail")
            failed_checks = [item for item in report["checks"] if item["status"] == "fail"]
            self.assertTrue(failed_checks)

            progress_text = (temp_knot / "runtime" / "progress.txt").read_text(encoding="utf-8")
            self.assertIn("PRECHECK", progress_text)
            self.assertIn("taskboard: fail", progress_text)

    def test_generated_preflight_report_validates_against_schema(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_knot = Path(tmp_dir) / "knot"
            shutil.copytree(KNOT_DIR, temp_knot)
            shutil.copyfile(
                temp_knot / "examples" / "project-spec.example.json",
                temp_knot / "runtime" / "project-spec.json",
            )

            result = self.run_cli(temp_knot)
            self.assertEqual(result.returncode, 0, result.stderr)

            validate = subprocess.run(
                [
                    sys.executable,
                    str(temp_knot / "automation" / "scripts" / "validate_schema.py"),
                    "--schema",
                    str(temp_knot / "automation" / "schemas" / "preflight-report.schema.json"),
                    "--input",
                    str(temp_knot / "runtime" / "reviews" / "preflight" / "latest.json"),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                check=False,
            )

        self.assertEqual(validate.returncode, 0, validate.stderr)
        self.assertIn("VALID", validate.stdout)


if __name__ == "__main__":
    unittest.main()
