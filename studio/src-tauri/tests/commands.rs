use std::fs;
use std::path::Path;

use knot_studio_lib::commands::{run_loop_once, run_preflight, save_taskboard};

#[test]
fn save_taskboard_rejects_invalid_knot_root_without_creating_runtime_file() {
    let temp = tempfile::tempdir().expect("temp dir");
    let invalid_root = temp.path().join("not-knot");
    fs::create_dir_all(&invalid_root).expect("invalid root");

    let result = save_taskboard(
        invalid_root.display().to_string(),
        "{\"project\":\"demo\"}".to_string(),
    );

    assert!(result.is_err());
    assert!(!invalid_root.join("runtime/taskboard.json").exists());
}

#[test]
fn run_preflight_rejects_invalid_knot_root() {
    let temp = tempfile::tempdir().expect("temp dir");
    let invalid_root = temp.path().join("not-knot");
    fs::create_dir_all(&invalid_root).expect("invalid root");

    let result = run_preflight(invalid_root.display().to_string());

    assert!(result.is_err());
    assert!(result
        .expect_err("invalid root")
        .contains(&invalid_root.display().to_string()));
}

#[test]
fn run_loop_once_rejects_invalid_tool() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    create_knot_root(&knot);

    let result = run_loop_once(knot.display().to_string(), "bogus".to_string(), 1);

    assert_eq!(result.expect_err("invalid tool"), "Unsupported tool: bogus");
}

#[test]
fn run_loop_once_rejects_zero_iterations() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    create_knot_root(&knot);

    let result = run_loop_once(knot.display().to_string(), "claude".to_string(), 0);

    assert_eq!(
        result.expect_err("zero iterations"),
        "maxIterations must be greater than 0"
    );
}

fn create_knot_root(knot: &Path) {
    fs::create_dir_all(knot.join("runtime")).expect("runtime");
    fs::create_dir_all(knot.join("automation/schemas")).expect("schemas");
    fs::create_dir_all(knot.join("automation/scripts")).expect("scripts");
    fs::create_dir_all(knot.join("core")).expect("core");
    fs::write(knot.join("runtime/taskboard.json"), "{}").expect("taskboard");
    fs::write(knot.join("automation/schemas/taskboard.schema.json"), "{}").expect("schema");
    fs::write(knot.join("automation/scripts/run_preflight.py"), "").expect("preflight");
    fs::write(knot.join("core/knot.sh"), "").expect("runner");
}
