use crate::{
    errors::AppResult,
    path_validation::{validate_taskboard_paths, RuntimeValidationIssue},
    schema_validation::validate_runtime_schemas,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const GATE_ORDER: [&str; 8] = [
    "existence",
    "structure",
    "business",
    "compliance",
    "continuity",
    "editorial",
    "brand",
    "custom",
];

#[derive(Debug, Clone, Deserialize)]
pub struct RuntimeSaveRequest {
    pub project_path: String,
    pub brief: String,
    pub project_spec: Value,
    pub taskboard: Value,
}

#[derive(Debug, Clone, Serialize)]
pub struct RuntimeSaveResult {
    pub ok: bool,
    pub issues: Vec<RuntimeValidationIssue>,
    pub written_files: Vec<String>,
    pub snapshot_dir: Option<String>,
}

pub fn save_runtime(request: RuntimeSaveRequest) -> AppResult<RuntimeSaveResult> {
    let project_path = PathBuf::from(&request.project_path);
    let knot_root = project_path.join("knot");
    let runtime_dir = project_path.join("knot/runtime");
    let project_spec = normalize_project_spec(request.project_spec);
    let taskboard = normalize_taskboard(request.taskboard);

    let mut issues = validate_runtime_schemas(&project_path, &project_spec, &taskboard)?;
    issues.extend(validate_taskboard_paths(&knot_root, &taskboard));

    if !issues.is_empty() {
        return Ok(RuntimeSaveResult {
            ok: false,
            issues,
            written_files: Vec::new(),
            snapshot_dir: None,
        });
    }

    fs::create_dir_all(&runtime_dir)?;
    let snapshot_dir = snapshot_runtime(&runtime_dir)?;
    let files = vec![
        ("project-brief.md", ensure_trailing_newline(&request.brief)),
        ("project-spec.json", json_string(&project_spec)?),
        ("taskboard.json", json_string(&taskboard)?),
    ];
    let written_files = write_runtime_files(&runtime_dir, files)?;

    Ok(RuntimeSaveResult {
        ok: true,
        issues: Vec::new(),
        written_files,
        snapshot_dir,
    })
}

fn normalize_project_spec(mut spec: Value) -> Value {
    if let Some(gates) = spec.pointer_mut("/review_policy/required_gates") {
        normalize_gate_array(gates);
    }
    spec
}

fn normalize_taskboard(mut taskboard: Value) -> Value {
    if let Some(stories) = taskboard.get_mut("stories").and_then(Value::as_array_mut) {
        for story in stories.iter_mut() {
            if story.get("status").is_none() {
                story["status"] = Value::String("todo".to_string());
            }
            if let Some(gates) = story.pointer_mut("/review_policy/required_gates") {
                normalize_gate_array(gates);
            }
            trim_path_array(story, "inputs");
            trim_path_array(story, "outputs");
        }

        stories.sort_by(|left, right| {
            let left_priority = left.get("priority").and_then(Value::as_i64).unwrap_or(9999);
            let right_priority = right
                .get("priority")
                .and_then(Value::as_i64)
                .unwrap_or(9999);
            let left_id = left.get("id").and_then(Value::as_str).unwrap_or("");
            let right_id = right.get("id").and_then(Value::as_str).unwrap_or("");
            left_priority
                .cmp(&right_priority)
                .then(left_id.cmp(right_id))
        });
    }

    taskboard
}

fn normalize_gate_array(value: &mut Value) {
    let mut gates = value.as_array().cloned().unwrap_or_default();
    gates.sort_by_key(|gate| {
        GATE_ORDER
            .iter()
            .position(|item| gate.as_str() == Some(item))
            .unwrap_or(usize::MAX)
    });
    gates.dedup();
    *value = Value::Array(gates);
}

fn trim_path_array(value: &mut Value, field: &str) {
    if let Some(paths) = value.get_mut(field).and_then(Value::as_array_mut) {
        for path in paths {
            if let Some(path_string) = path.as_str() {
                *path = Value::String(path_string.trim().to_string());
            }
        }
    }
}

fn snapshot_runtime(runtime_dir: &Path) -> AppResult<Option<String>> {
    let files = ["project-brief.md", "project-spec.json", "taskboard.json"];
    if !files.iter().any(|file| runtime_dir.join(file).exists()) {
        return Ok(None);
    }

    let snapshot_dir = runtime_dir
        .join("archive")
        .join(format!("workbench-save-{}", unix_seconds()));
    fs::create_dir_all(&snapshot_dir)?;
    for file in files {
        let source = runtime_dir.join(file);
        if source.exists() {
            fs::copy(source, snapshot_dir.join(file))?;
        }
    }
    Ok(Some(snapshot_dir.to_string_lossy().to_string()))
}

fn write_runtime_files(runtime_dir: &Path, files: Vec<(&str, String)>) -> AppResult<Vec<String>> {
    let mut written = Vec::new();
    for (name, content) in files {
        let target = runtime_dir.join(name);
        let temp = runtime_dir.join(format!(".workbench-tmp-{name}"));
        fs::write(&temp, content)?;
        fs::rename(&temp, &target)?;
        written.push(target.to_string_lossy().to_string());
    }
    Ok(written)
}

fn json_string(value: &Value) -> AppResult<String> {
    Ok(ensure_trailing_newline(&serde_json::to_string_pretty(
        value,
    )?))
}

fn ensure_trailing_newline(value: &str) -> String {
    if value.ends_with('\n') {
        value.to_string()
    } else {
        format!("{value}\n")
    }
}

fn unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::{normalize_taskboard, save_runtime, write_runtime_files, RuntimeSaveRequest};
    use serde_json::json;

    #[test]
    fn normalizes_story_order_and_gates() {
        let taskboard = json!({
            "stories": [
                {"id": "ST-002", "priority": 2, "review_policy": {"required_gates": ["business", "existence"]}},
                {"id": "ST-001", "priority": 1, "review_policy": {"required_gates": ["structure", "existence"]}}
            ]
        });

        let normalized = normalize_taskboard(taskboard);
        assert_eq!(normalized["stories"][0]["id"], "ST-001");
        assert_eq!(
            normalized["stories"][0]["review_policy"]["required_gates"],
            json!(["existence", "structure"])
        );
    }

    #[test]
    fn atomic_writer_replaces_target_file() {
        let dir = std::env::temp_dir().join("knot-workbench-runtime-writer");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("dir");

        write_runtime_files(&dir, vec![("project-brief.md", "next\n".to_string())]).expect("write");

        assert_eq!(
            std::fs::read_to_string(dir.join("project-brief.md")).expect("read"),
            "next\n"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn save_runtime_writes_core_files() {
        let project = std::env::temp_dir().join("knot-workbench-runtime-save");
        let _ = std::fs::remove_dir_all(&project);
        std::fs::create_dir_all(project.join("knot/automation/scripts")).expect("scripts");
        std::fs::create_dir_all(project.join("knot/automation/schemas")).expect("schemas");
        std::fs::write(
            project.join("knot/automation/scripts/validate_schema.py"),
            "import sys\nsys.exit(0)\n",
        )
        .expect("validator");

        let result = save_runtime(RuntimeSaveRequest {
            project_path: project.to_string_lossy().to_string(),
            brief: "# Brief".to_string(),
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
                    "review_root": "runtime/reviews/"
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
        })
        .expect("save");

        assert!(result.ok);
        assert!(project.join("knot/runtime/project-spec.json").exists());
        assert!(project.join("knot/runtime/taskboard.json").exists());
        assert_eq!(
            std::fs::read_to_string(project.join("knot/runtime/project-brief.md")).expect("brief"),
            "# Brief\n"
        );
        let _ = std::fs::remove_dir_all(&project);
    }
}
