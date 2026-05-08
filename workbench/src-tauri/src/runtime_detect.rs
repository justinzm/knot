use serde::Serialize;
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeKind {
    Missing,
    Empty,
    Demo,
    Production,
}

#[derive(Debug, Clone)]
pub struct RuntimeMetadata {
    pub project_id: Option<String>,
    pub story_count: usize,
    pub progress_entries: usize,
    pub review_count: usize,
}

pub fn inspect_runtime(runtime_dir: &Path) -> (RuntimeKind, RuntimeMetadata) {
    let metadata = RuntimeMetadata {
        project_id: read_project_id(runtime_dir.join("project-spec.json")),
        story_count: count_stories(runtime_dir.join("taskboard.json")),
        progress_entries: count_progress_entries(runtime_dir.join("progress.txt")),
        review_count: count_review_files(runtime_dir.join("reviews")),
    };
    let kind = classify_runtime(runtime_dir.is_dir(), &metadata);

    (kind, metadata)
}

pub fn classify_runtime(has_runtime: bool, metadata: &RuntimeMetadata) -> RuntimeKind {
    if !has_runtime {
        return RuntimeKind::Missing;
    }

    if metadata.project_id.is_none()
        && metadata.story_count == 0
        && metadata.progress_entries == 0
        && metadata.review_count == 0
    {
        return RuntimeKind::Empty;
    }

    let demo_project = metadata
        .project_id
        .as_deref()
        .map(|id| {
            let id = id.to_ascii_lowercase();
            id.contains("demo") || id.contains("starter") || id.contains("example")
        })
        .unwrap_or(false);

    if demo_project && metadata.review_count == 0 {
        RuntimeKind::Demo
    } else {
        RuntimeKind::Production
    }
}

pub fn read_project_id(path: PathBuf) -> Option<String> {
    let contents = fs::read_to_string(path).ok()?;
    let value: Value = serde_json::from_str(&contents).ok()?;

    value
        .get("project_id")
        .and_then(Value::as_str)
        .map(ToString::to_string)
}

fn count_stories(path: PathBuf) -> usize {
    let contents = match fs::read_to_string(path) {
        Ok(contents) => contents,
        Err(_) => return 0,
    };
    let value: Value = match serde_json::from_str(&contents) {
        Ok(value) => value,
        Err(_) => return 0,
    };

    value
        .get("stories")
        .and_then(Value::as_array)
        .map(Vec::len)
        .unwrap_or(0)
}

fn count_progress_entries(path: PathBuf) -> usize {
    fs::read_to_string(path)
        .map(|contents| {
            contents
                .lines()
                .filter(|line| line.starts_with("## "))
                .count()
        })
        .unwrap_or(0)
}

fn count_review_files(path: PathBuf) -> usize {
    if !path.is_dir() {
        return 0;
    }

    walk_files(&path).len()
}

pub fn walk_files(root: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(_) => return files,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            files.extend(walk_files(&path));
        } else {
            files.push(path);
        }
    }

    files
}

#[cfg(test)]
mod tests {
    use super::{classify_runtime, RuntimeKind, RuntimeMetadata};

    #[test]
    fn production_is_detected_when_reviews_exist() {
        let metadata = RuntimeMetadata {
            project_id: Some("starter-example".to_string()),
            story_count: 1,
            progress_entries: 0,
            review_count: 1,
        };

        assert_eq!(classify_runtime(true, &metadata), RuntimeKind::Production);
    }
}
