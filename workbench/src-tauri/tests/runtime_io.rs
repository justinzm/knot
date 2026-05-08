use knot_workbench_lib::runtime_io::{save_runtime, RuntimeSaveRequest};
use serde_json::json;

fn sample_request(project_path: String) -> RuntimeSaveRequest {
    RuntimeSaveRequest {
        project_path,
        brief: "# 简报".to_string(),
        project_spec: json!({
            "project_id": "demo",
            "project_type": "content",
            "target_medium": "markdown",
            "language": "zh-CN",
            "audience": "team",
            "style": {"voice": "clear", "visual_style": "minimal", "tone": "calm"},
            "workflow": {
                "stages": ["brief"],
                "artifact_root": "outputs/",
                "fact_root": "assets/",
                "review_root": "knot/runtime/reviews/"
            },
            "review_policy": {"required_gates": ["existence"], "notes": "required"},
            "naming": {"story_prefix": "ST", "artifact_convention": "outputs/{id}.md"}
        }),
        taskboard: json!({
            "project": "demo",
            "workflow": "content",
            "description": "demo workflow",
            "stories": [{
                "id": "ST-001",
                "title": "Story one",
                "stage": "brief",
                "description": "Create the first artifact.",
                "priority": 1,
                "status": "ready",
                "inputs": ["runtime/project-brief.md"],
                "outputs": ["outputs/story-one.md"],
                "dependencies": [],
                "acceptance_criteria": ["Artifact exists"],
                "review_policy": {"required_gates": ["existence"]},
                "notes": ""
            }]
        }),
    }
}

#[test]
fn save_runtime_creates_snapshot_when_existing_files_present() {
    let project = std::env::temp_dir().join("knot-workbench-runtime-io-test");
    let _ = std::fs::remove_dir_all(&project);
    std::fs::create_dir_all(project.join("knot/automation/scripts")).expect("scripts");
    std::fs::create_dir_all(project.join("knot/automation/schemas")).expect("schemas");
    std::fs::create_dir_all(project.join("knot/runtime")).expect("runtime");
    std::fs::write(
        project.join("knot/automation/scripts/validate_schema.py"),
        "import sys\nsys.exit(0)\n",
    )
    .expect("validator");
    std::fs::write(project.join("knot/runtime/project-brief.md"), "old\n").expect("seed brief");

    let result =
        save_runtime(sample_request(project.to_string_lossy().to_string())).expect("save runtime");

    assert!(result.ok);
    let snapshot_dir = result.snapshot_dir.expect("snapshot dir");
    assert!(std::path::Path::new(&snapshot_dir).join("project-brief.md").exists());
    assert_eq!(
        std::fs::read_to_string(project.join("knot/runtime/project-brief.md")).expect("brief"),
        "# 简报\n"
    );

    let _ = std::fs::remove_dir_all(&project);
}
