use crate::{
    errors::AppResult,
    progress::{parse_progress, ProgressEntry},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

#[derive(Debug, Clone, Deserialize)]
pub struct ArtifactsRequest {
    pub project_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ArtifactItem {
    pub kind: String,
    pub path: String,
    pub exists: bool,
    pub size: u64,
    pub modified: Option<u64>,
    pub status: String,
    pub preview: String,
    pub parse_error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ArtifactsSnapshot {
    pub outputs: Vec<ArtifactItem>,
    pub reviews: Vec<ArtifactItem>,
    pub progress: Vec<ProgressEntry>,
}

pub fn read_artifacts(request: ArtifactsRequest) -> AppResult<ArtifactsSnapshot> {
    let project_path = PathBuf::from(request.project_path);
    let knot_root = project_path.join("knot");
    let taskboard = read_json(&knot_root.join("runtime/taskboard.json")).unwrap_or(Value::Null);
    let outputs = declared_paths(&taskboard, "outputs")
        .into_iter()
        .map(|path| item_for_path(&knot_root, "output", &path))
        .collect();
    let mut reviews: Vec<_> = declared_review_paths(&taskboard)
        .into_iter()
        .map(|path| item_for_path(&knot_root, "review", &path))
        .collect();
    reviews.extend(scan_review_files(&knot_root));
    reviews.sort_by(|left, right| left.path.cmp(&right.path));
    reviews.dedup_by(|left, right| left.path == right.path);

    let progress_content =
        fs::read_to_string(knot_root.join("runtime/progress.txt")).unwrap_or_default();

    Ok(ArtifactsSnapshot {
        outputs,
        reviews,
        progress: parse_progress(&progress_content),
    })
}

fn declared_paths(taskboard: &Value, field: &str) -> Vec<String> {
    taskboard
        .get("stories")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .flat_map(|story| {
            story
                .get(field)
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default()
        })
        .filter_map(|value| value.as_str().map(str::to_string))
        .collect()
}

fn declared_review_paths(taskboard: &Value) -> Vec<String> {
    taskboard
        .get("stories")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .flat_map(|story| {
            story
                .pointer("/review_policy/review_artifacts")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default()
        })
        .filter_map(|value| value.as_str().map(str::to_string))
        .collect()
}

fn scan_review_files(knot_root: &Path) -> Vec<ArtifactItem> {
    let review_root = knot_root.join("runtime/reviews");
    let mut items = Vec::new();
    collect_json_files(knot_root, &review_root, &mut items);
    items
}

fn collect_json_files(knot_root: &Path, dir: &Path, items: &mut Vec<ArtifactItem>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_json_files(knot_root, &path, items);
        } else if path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            if let Ok(relative) = path.strip_prefix(knot_root) {
                items.push(item_for_path(
                    knot_root,
                    "review",
                    &relative.to_string_lossy(),
                ));
            }
        }
    }
}

fn item_for_path(knot_root: &Path, kind: &str, path: &str) -> ArtifactItem {
    let full_path = knot_root.join(path);
    let metadata = fs::metadata(&full_path).ok();
    let content = fs::read_to_string(&full_path).unwrap_or_default();
    let parse_error = json_parse_error(&full_path, &content);
    let status = item_status(kind, metadata.is_some(), parse_error.as_deref(), &content);

    ArtifactItem {
        kind: kind.to_string(),
        path: path.to_string(),
        exists: metadata.is_some(),
        size: metadata.as_ref().map(|item| item.len()).unwrap_or(0),
        modified: metadata
            .and_then(|item| item.modified().ok())
            .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs()),
        status,
        preview: content.chars().take(8000).collect(),
        parse_error,
    }
}

fn item_status(kind: &str, exists: bool, parse_error: Option<&str>, content: &str) -> String {
    if !exists {
        return "missing".to_string();
    }
    if parse_error.is_some() {
        return "json_error".to_string();
    }
    if kind == "review" && content.contains("\"status\"") && content.contains("\"fail\"") {
        return "fail".to_string();
    }
    "ok".to_string()
}

fn json_parse_error(path: &Path, content: &str) -> Option<String> {
    if path.extension().and_then(|ext| ext.to_str()) != Some("json") || content.is_empty() {
        return None;
    }
    serde_json::from_str::<Value>(content)
        .err()
        .map(|error| error.to_string())
}

fn read_json(path: &Path) -> Option<Value> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
}

#[cfg(test)]
mod tests {
    use super::read_artifacts;
    use crate::artifacts::ArtifactsRequest;

    #[test]
    fn reads_declared_missing_output() {
        let root = std::env::temp_dir().join("knot-workbench-artifacts");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("knot/runtime")).expect("runtime");
        std::fs::write(
            root.join("knot/runtime/progress.txt"),
            "## [now] - PRECHECK\n- Status: pass\n---",
        )
        .expect("progress");
        std::fs::write(
            root.join("knot/runtime/taskboard.json"),
            r#"{"stories":[{"outputs":["outputs/a.md"],"review_policy":{"review_artifacts":["runtime/reviews/a.json"]}}]}"#,
        )
        .expect("taskboard");

        let snapshot = read_artifacts(ArtifactsRequest {
            project_path: root.to_string_lossy().to_string(),
        })
        .expect("snapshot");

        assert_eq!(snapshot.outputs[0].status, "missing");
        assert_eq!(snapshot.progress[0].kind, "PRECHECK");
        let _ = std::fs::remove_dir_all(&root);
    }
}
