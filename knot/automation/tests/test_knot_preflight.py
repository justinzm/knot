import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
KNOT_DIR = ROOT / "knot"
BASH_CANDIDATES = [
    Path(r"C:\Program Files\Git\bin\bash.exe"),
    Path(r"C:\Program Files\Git\usr\bin\bash.exe"),
    Path(r"C:\Windows\System32\bash.exe"),
]


class KnotPreflightTests(unittest.TestCase):
    def test_knot_sh_fails_fast_when_taskboard_is_invalid(self) -> None:
        bash_path = next((path for path in BASH_CANDIDATES if path.exists()), None)
        if bash_path is None:
            self.skipTest("No usable bash executable found")

        probe = subprocess.run(
            [str(bash_path), "-lc", "echo bash-ok"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if probe.returncode != 0:
            self.skipTest(f"Bash is present but unusable in this environment: {probe.stderr or probe.stdout}")

        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_knot = Path(tmp_dir) / "knot"
            shutil.copytree(KNOT_DIR, temp_knot)
            shutil.copyfile(
                temp_knot / "examples" / "project-spec.example.json",
                temp_knot / "runtime" / "project-spec.json",
            )

            invalid_taskboard = {
                "project": "broken-demo",
                "workflow": "content-production",
                "description": "Missing stories array"
            }
            (temp_knot / "runtime" / "taskboard.json").write_text(
                json.dumps(invalid_taskboard),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    str(bash_path),
                    str(temp_knot / "core" / "knot.sh"),
                    "1",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                check=False,
            )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("taskboard", result.stdout.lower() + result.stderr.lower())
        self.assertIn("invalid", result.stdout.lower() + result.stderr.lower())


if __name__ == "__main__":
    unittest.main()
