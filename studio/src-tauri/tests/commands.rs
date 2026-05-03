use std::fs;

use knot_studio_lib::commands::save_taskboard;

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
