use std::fs;
use std::path::Path;

use knot_studio_lib::process::run_preflight_process;

#[test]
fn run_preflight_process_returns_serializable_result_shape() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    create_knot_root(&knot);
    fs::write(
        knot.join("automation/scripts/run_preflight.py"),
        r#"import sys
print("preflight stdout")
print("preflight stderr", file=sys.stderr)
sys.exit(7)
"#,
    )
    .expect("preflight script");

    let result = run_preflight_process(&knot).expect("process result");
    let json = serde_json::to_value(&result).expect("serialize result");

    assert_eq!(result.status, "fail");
    assert_eq!(result.exit_code, Some(7));
    assert!(result.stdout.contains("preflight stdout"));
    assert!(result.stderr.contains("preflight stderr"));
    assert_eq!(json["exitCode"], 7);
    assert_eq!(json["stdout"], "preflight stdout\n");
}

fn create_knot_root(knot: &Path) {
    fs::create_dir_all(knot.join("runtime")).expect("runtime");
    fs::create_dir_all(knot.join("automation/schemas")).expect("schemas");
    fs::create_dir_all(knot.join("automation/scripts")).expect("scripts");
    fs::create_dir_all(knot.join("core")).expect("core");
    fs::write(knot.join("runtime/taskboard.json"), "{}").expect("taskboard");
    fs::write(knot.join("automation/schemas/taskboard.schema.json"), "{}").expect("schema");
    fs::write(knot.join("core/knot.sh"), "").expect("runner");
}
