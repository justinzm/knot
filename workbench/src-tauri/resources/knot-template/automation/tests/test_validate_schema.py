import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
KNOT_DIR = ROOT / "knot"
SCRIPT = KNOT_DIR / "automation" / "scripts" / "validate_schema.py"


class ValidateSchemaCliTests(unittest.TestCase):
    def run_cli(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )

    def test_valid_taskboard_example_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "taskboard.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "taskboard.json.example"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_valid_review_result_example_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "review-result.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "review-result.example.json"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_valid_preflight_report_example_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "preflight-report.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "preflight-report.example.json"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_valid_project_spec_example_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "project-spec.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "project-spec.example.json"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_default_runtime_project_spec_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "project-spec.schema.json"),
            "--input",
            str(KNOT_DIR / "runtime" / "project-spec.json"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_default_runtime_taskboard_passes(self) -> None:
        result = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "taskboard.schema.json"),
            "--input",
            str(KNOT_DIR / "runtime" / "taskboard.json"),
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("VALID", result.stdout)

    def test_starter_empty_examples_pass(self) -> None:
        project_spec = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "project-spec.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "starter-empty" / "project-spec.json"),
        )
        taskboard = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "taskboard.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "starter-empty" / "taskboard.json"),
        )

        self.assertEqual(project_spec.returncode, 0, project_spec.stderr)
        self.assertEqual(taskboard.returncode, 0, taskboard.stderr)

    def test_seedance_template_examples_pass(self) -> None:
        project_spec = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "project-spec.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "templates" / "seedance-short-drama" / "project-spec.json"),
        )
        taskboard = self.run_cli(
            "--schema",
            str(KNOT_DIR / "automation" / "schemas" / "taskboard.schema.json"),
            "--input",
            str(KNOT_DIR / "examples" / "templates" / "seedance-short-drama" / "taskboard.json"),
        )

        self.assertEqual(project_spec.returncode, 0, project_spec.stderr)
        self.assertEqual(taskboard.returncode, 0, taskboard.stderr)

    def test_invalid_review_result_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            invalid_path = Path(tmp_dir) / "invalid-review.json"
            invalid_path.write_text(
                json.dumps(
                    {
                        "review_id": "RV-001",
                        "story_id": "ST-002",
                        "review_type": "business",
                        "reviewer": "story-editor",
                        "status": "pass",
                        "created_at": "2026-04-24T03:30:00Z",
                        "summary": "Missing artifact_paths and findings"
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_cli(
                "--schema",
                str(KNOT_DIR / "automation" / "schemas" / "review-result.schema.json"),
                "--input",
                str(invalid_path),
            )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("INVALID", result.stdout)


if __name__ == "__main__":
    unittest.main()
