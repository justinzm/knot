import importlib.util
import os
import stat
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
KNOT_DIR = ROOT / "knot"
INIT_PROJECT_PATH = (
    KNOT_DIR
    / "examples"
    / "templates"
    / "seedance-short-drama"
    / "knot-init"
    / "init_project.py"
)

INIT_PROJECT_SPEC = importlib.util.spec_from_file_location("seedance_init_project", INIT_PROJECT_PATH)
assert INIT_PROJECT_SPEC is not None
init_project = importlib.util.module_from_spec(INIT_PROJECT_SPEC)
assert INIT_PROJECT_SPEC.loader is not None
INIT_PROJECT_SPEC.loader.exec_module(init_project)


class FilePermissionTests(unittest.TestCase):
    def test_core_runner_is_executable_in_template_source(self) -> None:
        runner = KNOT_DIR / "core" / "knot.sh"
        mode = runner.stat().st_mode

        self.assertTrue(mode & stat.S_IXUSR)
        self.assertTrue(mode & stat.S_IXGRP)
        self.assertTrue(mode & stat.S_IXOTH)

    def test_seedance_initializer_restores_runner_executable_bit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            knot_dir = Path(tmp_dir) / "knot"
            runner = knot_dir / "core" / "knot.sh"
            runner.parent.mkdir(parents=True)
            runner.write_text("#!/usr/bin/env bash\n", encoding="utf-8")
            runner.chmod(0o644)

            init_project.ensure_runner_executable(knot_dir, dry_run=False)

            self.assertTrue(os.access(runner, os.X_OK))
            self.assertEqual(stat.S_IMODE(runner.stat().st_mode), 0o755)


if __name__ == "__main__":
    unittest.main()
