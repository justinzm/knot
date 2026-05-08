use serde::Serialize;
use std::path::PathBuf;

use crate::runtime_detect::{inspect_runtime, RuntimeKind};

#[derive(Debug, Serialize)]
pub struct ProjectSummary {
    pub path: String,
    pub name: String,
    pub has_knot_dir: bool,
    pub has_core: bool,
    pub has_automation: bool,
    pub has_runtime: bool,
    pub runtime_kind: RuntimeKind,
    pub project_id: Option<String>,
    pub story_count: usize,
    pub progress_entries: usize,
    pub review_count: usize,
}

pub fn inspect_project(path: String) -> ProjectSummary {
    let root = PathBuf::from(&path);
    let knot_dir = root.join("knot");
    let runtime_dir = knot_dir.join("runtime");
    let (runtime_kind, metadata) = inspect_runtime(&runtime_dir);
    let has_runtime = runtime_dir.is_dir();

    ProjectSummary {
        name: root
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("未命名项目")
            .to_string(),
        path,
        has_knot_dir: knot_dir.is_dir(),
        has_core: knot_dir.join("core").is_dir(),
        has_automation: knot_dir.join("automation").is_dir(),
        has_runtime,
        runtime_kind,
        project_id: metadata.project_id,
        story_count: metadata.story_count,
        progress_entries: metadata.progress_entries,
        review_count: metadata.review_count,
    }
}

#[cfg(test)]
mod tests {
    use super::{inspect_project, RuntimeKind};

    #[test]
    fn detects_missing_knot_project() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-project-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).expect("temp project should exist");

        let summary = inspect_project(temp_dir.to_string_lossy().to_string());

        assert!(!summary.has_knot_dir);
        assert_eq!(summary.runtime_kind, RuntimeKind::Missing);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
