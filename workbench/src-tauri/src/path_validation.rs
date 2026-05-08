use serde_json::Value;
use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone, serde::Serialize)]
pub struct RuntimeValidationIssue {
    pub file: String,
    pub field: String,
    pub story_id: Option<String>,
    pub message: String,
}

pub fn validate_taskboard_paths(
    project_path: &Path,
    taskboard: &Value,
) -> Vec<RuntimeValidationIssue> {
    let stories = taskboard
        .get("stories")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let upstream_outputs = collect_outputs(&stories);
    let mut issues = Vec::new();

    for story in stories {
        let story_id = story
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or("unknown")
            .to_string();
        check_inputs(
            project_path,
            &story,
            &story_id,
            &upstream_outputs,
            &mut issues,
        );
        check_outputs(project_path, &story, &story_id, &mut issues);
        check_review_artifacts(project_path, &story, &story_id, &mut issues);
    }

    issues
}

fn collect_outputs(stories: &[Value]) -> HashSet<String> {
    stories
        .iter()
        .flat_map(|story| {
            story
                .get("outputs")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default()
        })
        .filter_map(|path| path.as_str().map(str::to_string))
        .collect()
}

fn check_inputs(
    project_path: &Path,
    story: &Value,
    story_id: &str,
    upstream_outputs: &HashSet<String>,
    issues: &mut Vec<RuntimeValidationIssue>,
) {
    for path in string_array(story, "inputs") {
        if invalid_relative_path(&path) {
            push_issue(
                issues,
                "taskboard.json",
                "inputs",
                story_id,
                &path,
                "输入路径不能是绝对路径或 ../",
            );
            continue;
        }
        if !is_runtime_core_file(&path)
            && !upstream_outputs.contains(&path)
            && !project_path.join(&path).exists()
        {
            push_issue(
                issues,
                "taskboard.json",
                "inputs",
                story_id,
                &path,
                "输入路径不存在，且不是上游 story 输出",
            );
        }
    }
}

fn is_runtime_core_file(path: &str) -> bool {
    matches!(
        path,
        "runtime/project-brief.md" | "runtime/project-spec.json" | "runtime/taskboard.json"
    )
}

fn check_outputs(
    project_path: &Path,
    story: &Value,
    story_id: &str,
    issues: &mut Vec<RuntimeValidationIssue>,
) {
    for path in string_array(story, "outputs") {
        if invalid_relative_path(&path) {
            push_issue(
                issues,
                "taskboard.json",
                "outputs",
                story_id,
                &path,
                "输出路径不能是绝对路径或 ../",
            );
            continue;
        }
        if let Some(parent) = project_path.join(&path).parent() {
            if !parent_can_be_created(parent) {
                push_issue(
                    issues,
                    "taskboard.json",
                    "outputs",
                    story_id,
                    &path,
                    "输出父目录不可创建或不可写",
                );
            }
        }
    }
}

fn check_review_artifacts(
    project_path: &Path,
    story: &Value,
    story_id: &str,
    issues: &mut Vec<RuntimeValidationIssue>,
) {
    let artifacts = story
        .pointer("/review_policy/review_artifacts")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    for artifact in artifacts {
        if let Some(path) = artifact.as_str() {
            if invalid_relative_path(path) {
                push_issue(
                    issues,
                    "taskboard.json",
                    "review_artifacts",
                    story_id,
                    path,
                    "Review 产物路径不能是绝对路径或 ../",
                );
                continue;
            }
            if let Some(parent) = project_path.join(path).parent() {
                if !parent_can_be_created(parent) {
                    push_issue(
                        issues,
                        "taskboard.json",
                        "review_artifacts",
                        story_id,
                        path,
                        "Review 产物父目录不可创建或不可写",
                    );
                }
            }
        }
    }
}

fn string_array(object: &Value, field: &str) -> Vec<String> {
    object
        .get(field)
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| value.as_str().map(|item| item.trim().to_string()))
        .collect()
}

fn invalid_relative_path(path: &str) -> bool {
    let path = PathBuf::from(path);
    path.is_absolute()
        || path
            .components()
            .any(|component| matches!(component, Component::ParentDir))
}

fn parent_can_be_created(parent: &Path) -> bool {
    parent.exists() || parent.parent().is_some_and(parent_can_be_created)
}

fn push_issue(
    issues: &mut Vec<RuntimeValidationIssue>,
    file: &str,
    field: &str,
    story_id: &str,
    path: &str,
    message: &str,
) {
    issues.push(RuntimeValidationIssue {
        file: file.to_string(),
        field: field.to_string(),
        story_id: Some(story_id.to_string()),
        message: format!("{message}：{path}"),
    });
}

#[cfg(test)]
mod tests {
    use super::validate_taskboard_paths;
    use serde_json::json;

    #[test]
    fn missing_input_is_reported() {
        let taskboard = json!({
            "stories": [{
                "id": "ST-001",
                "inputs": ["missing.md"],
                "outputs": ["outputs/a.md"],
                "review_policy": { "review_artifacts": [] }
            }]
        });

        let issues = validate_taskboard_paths(&std::env::temp_dir(), &taskboard);

        assert!(issues.iter().any(|issue| issue.field == "inputs"));
    }
}
