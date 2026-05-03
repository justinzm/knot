use std::fs;

use knot_studio_lib::runtime::{discover_runtime, read_runtime_snapshot, write_atomic};

#[test]
fn discover_runtime_finds_nested_knot_dir() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    fs::create_dir_all(project.join("knot/runtime")).expect("create runtime");
    fs::create_dir_all(project.join("knot/automation/schemas")).expect("create schemas");
    fs::create_dir_all(project.join("knot/core")).expect("create core");

    let runtime = discover_runtime(project).expect("runtime");

    assert_eq!(runtime.project_root, project);
    assert_eq!(runtime.knot_root, project.join("knot"));
}

#[test]
fn write_atomic_replaces_file_contents() {
    let temp = tempfile::tempdir().expect("temp dir");
    let file = temp.path().join("runtime/taskboard.json");

    write_atomic(&file, "first").expect("first write");
    write_atomic(&file, "second").expect("second write");

    assert_eq!(fs::read_to_string(file).expect("read file"), "second");
}

#[test]
fn read_runtime_snapshot_reads_known_files() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    fs::create_dir_all(knot.join("runtime")).expect("runtime");
    fs::create_dir_all(knot.join("automation/schemas")).expect("schemas");
    fs::create_dir_all(knot.join("core")).expect("core");
    fs::write(knot.join("runtime/project-brief.md"), "# Brief").expect("brief");
    fs::write(
        knot.join("runtime/project-spec.json"),
        "{\"project_id\":\"demo\"}",
    )
    .expect("spec");
    fs::write(
        knot.join("runtime/taskboard.json"),
        "{\"project\":\"demo\"}",
    )
    .expect("taskboard");
    fs::write(knot.join("runtime/progress.txt"), "# Progress").expect("progress");

    let snapshot = read_runtime_snapshot(&knot).expect("snapshot");

    assert_eq!(snapshot.project_brief, "# Brief");
    assert_eq!(snapshot.progress_text, "# Progress");
    assert!(snapshot.project_spec_json.contains("demo"));
    assert!(snapshot.taskboard_json.contains("demo"));
}
