use knot_workbench_lib::runtime_detect::{classify_runtime, RuntimeKind, RuntimeMetadata};

#[test]
fn classifies_missing_demo_and_production_runtime() {
    let empty = RuntimeMetadata {
        project_id: None,
        story_count: 0,
        progress_entries: 0,
        review_count: 0,
    };
    let demo = RuntimeMetadata {
        project_id: Some("starter-example".to_string()),
        story_count: 1,
        progress_entries: 1,
        review_count: 0,
    };
    let production = RuntimeMetadata {
        project_id: Some("client-project".to_string()),
        story_count: 2,
        progress_entries: 3,
        review_count: 1,
    };

    assert_eq!(classify_runtime(false, &empty), RuntimeKind::Missing);
    assert_eq!(classify_runtime(true, &empty), RuntimeKind::Empty);
    assert_eq!(classify_runtime(true, &demo), RuntimeKind::Demo);
    assert_eq!(classify_runtime(true, &production), RuntimeKind::Production);
}
