use std::fs;
use std::path::Path;

use knot_studio_lib::runtime::{
    discover_runtime, list_runtime_artifacts, read_runtime_snapshot, write_atomic,
};

#[test]
fn discover_runtime_finds_direct_knot_root() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    create_knot_root(project);

    let runtime = discover_runtime(project).expect("runtime");

    assert_eq!(runtime.project_root, project);
    assert_eq!(runtime.knot_root, project);
}

#[test]
fn discover_runtime_finds_nested_knot_dir() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    create_knot_root(&project.join("knot"));

    let runtime = discover_runtime(project).expect("runtime");

    assert_eq!(runtime.project_root, project);
    assert_eq!(runtime.knot_root, project.join("knot"));
}

#[test]
fn discover_runtime_rejects_incomplete_lookalike_directory() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    fs::create_dir_all(project.join("knot/runtime")).expect("create runtime");
    fs::create_dir_all(project.join("knot/automation/schemas")).expect("create schemas");
    fs::create_dir_all(project.join("knot/core")).expect("create core");

    let error = discover_runtime(project).expect_err("lookalike rejected");

    assert!(error.to_string().contains(&project.display().to_string()));
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
fn write_atomic_does_not_clobber_existing_sibling_temp_like_file() {
    let temp = tempfile::tempdir().expect("temp dir");
    let file = temp.path().join("runtime/taskboard.json");
    let sibling = temp.path().join("runtime/taskboard.tmp");
    fs::create_dir_all(sibling.parent().expect("sibling parent")).expect("parent");
    fs::write(&sibling, "keep me").expect("sibling");

    write_atomic(&file, "new contents").expect("write");

    assert_eq!(
        fs::read_to_string(&file).expect("read file"),
        "new contents"
    );
    assert_eq!(
        fs::read_to_string(&sibling).expect("read sibling"),
        "keep me"
    );
}

#[test]
fn write_atomic_error_mentions_failed_path() {
    let temp = tempfile::tempdir().expect("temp dir");
    let parent_as_file = temp.path().join("runtime");
    fs::write(&parent_as_file, "not a directory").expect("parent file");
    let file = parent_as_file.join("taskboard.json");

    let error = write_atomic(&file, "contents").expect_err("write fails");

    assert!(error.to_string().contains(&file.display().to_string()));
}

#[test]
fn read_runtime_snapshot_reads_known_files() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    create_knot_root(&knot);
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

#[test]
fn list_runtime_artifacts_reads_progress_reviews_and_project_outputs() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    let knot = project.join("knot");
    create_knot_root(&knot);
    fs::write(knot.join("runtime/progress.txt"), "progress log").expect("progress");
    fs::create_dir_all(knot.join("runtime/reviews/preflight")).expect("reviews");
    fs::write(
        knot.join("runtime/reviews/preflight/latest.json"),
        "{\"status\":\"pass\"}",
    )
    .expect("review");
    fs::create_dir_all(project.join("outputs/scenes")).expect("outputs");
    fs::write(project.join("outputs/scenes/scene.md"), "scene draft").expect("output");

    let artifacts = list_runtime_artifacts(&knot).expect("artifacts");

    let paths = artifacts
        .iter()
        .map(|artifact| {
            (
                artifact.kind.as_str(),
                artifact.path.as_str(),
                artifact.contents.as_str(),
            )
        })
        .collect::<Vec<_>>();
    assert_eq!(
        paths,
        vec![
            ("output", "outputs/scenes/scene.md", "scene draft"),
            ("progress", "knot/runtime/progress.txt", "progress log"),
            (
                "review",
                "knot/runtime/reviews/preflight/latest.json",
                "{\"status\":\"pass\"}"
            ),
        ]
    );
    assert!(artifacts.iter().all(|artifact| artifact.exists));
}

#[test]
fn list_runtime_artifacts_uses_empty_contents_for_unreadable_files() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    create_knot_root(&knot);
    fs::write(knot.join("runtime/progress.txt"), [0xff, 0xfe, 0xfd]).expect("binary progress");

    let artifacts = list_runtime_artifacts(&knot).expect("artifacts");

    assert_eq!(artifacts.len(), 1);
    assert_eq!(artifacts[0].path, "knot/runtime/progress.txt");
    assert_eq!(artifacts[0].kind.as_str(), "progress");
    assert_eq!(artifacts[0].contents, "");
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
