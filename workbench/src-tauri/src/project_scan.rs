use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Deserialize)]
pub struct ScanProjectRequest {
    pub project_path: String,
    pub exclusions: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectScanSummary {
    pub project_path: String,
    pub included_roots: Vec<String>,
    pub excluded_paths: Vec<String>,
    pub recognized_files: Vec<String>,
    pub target_files: Vec<String>,
}

pub fn scan_project(request: ScanProjectRequest) -> ProjectScanSummary {
    let root = PathBuf::from(&request.project_path);
    let mut included_roots = Vec::new();
    let mut excluded_paths = Vec::new();
    let mut recognized_files = Vec::new();
    let exclusions = normalize_exclusions(&request.exclusions);

    if let Ok(entries) = fs::read_dir(&root) {
        for entry in entries.flatten() {
            let path = entry.path();
            let relative = relative_string(&root, &path);
            if should_exclude(&relative, &exclusions) {
                excluded_paths.push(relative);
            } else if path.is_dir() {
                included_roots.push(relative);
            } else if is_recognized_file(&relative) {
                recognized_files.push(relative);
            }
        }
    }

    included_roots.sort();
    excluded_paths.sort();
    recognized_files.sort();

    ProjectScanSummary {
        project_path: request.project_path,
        included_roots,
        excluded_paths,
        recognized_files,
        target_files: vec![
            "knot/runtime/project-brief.md".to_string(),
            "knot/runtime/project-spec.json".to_string(),
            "knot/runtime/taskboard.json".to_string(),
            "knot/runtime/progress.txt".to_string(),
        ],
    }
}

fn normalize_exclusions(exclusions: &[String]) -> Vec<String> {
    exclusions
        .iter()
        .map(|item| item.trim().trim_matches('/').to_string())
        .filter(|item| !item.is_empty())
        .collect()
}

fn should_exclude(relative: &str, exclusions: &[String]) -> bool {
    exclusions
        .iter()
        .any(|excluded| relative == excluded || relative.starts_with(&format!("{excluded}/")))
}

fn is_recognized_file(relative: &str) -> bool {
    matches!(
        relative,
        "AGENTS.md"
            | "CLAUDE.md"
            | "README.md"
            | "README.zh-CN.md"
            | "config.json"
            | "package.json"
            | "Product-Spec.md"
            | "Design-Brief.md"
    ) || relative.ends_with(".md")
        || relative.ends_with(".json")
        || relative.ends_with(".txt")
}

fn relative_string(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

#[cfg(test)]
mod tests {
    use super::{scan_project, ScanProjectRequest};

    #[test]
    fn scan_respects_exclusions_and_targets_runtime_files() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-scan-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(temp_dir.join("script")).expect("script");
        std::fs::create_dir_all(temp_dir.join("node_modules")).expect("node_modules");
        std::fs::write(temp_dir.join("README.md"), "brief").expect("readme");

        let summary = scan_project(ScanProjectRequest {
            project_path: temp_dir.to_string_lossy().to_string(),
            exclusions: vec!["node_modules".to_string()],
        });

        assert!(summary.included_roots.contains(&"script".to_string()));
        assert!(summary.excluded_paths.contains(&"node_modules".to_string()));
        assert!(summary.recognized_files.contains(&"README.md".to_string()));
        assert!(summary
            .target_files
            .contains(&"knot/runtime/taskboard.json".to_string()));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
