use serde::Serialize;
use std::{fs, path::Path, time::SystemTime};

use crate::{
    errors::AppResult,
    runtime_detect::{read_project_id, walk_files},
};

#[derive(Debug, Clone, Serialize)]
pub struct BackupSummary {
    pub archive_path: String,
    pub copied_files: usize,
}

pub fn backup_runtime(project_path: &Path) -> AppResult<Option<BackupSummary>> {
    let runtime_dir = project_path.join("knot").join("runtime");
    if !runtime_dir.is_dir() {
        return Ok(None);
    }

    let project_id = read_project_id(runtime_dir.join("project-spec.json")).unwrap_or_else(|| {
        project_path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("project")
            .to_string()
    });
    let archive_name = format!("{}-{}", unix_seconds(), sanitize_archive_name(&project_id));
    let archive_dir = runtime_dir.join("archive").join(archive_name);
    fs::create_dir_all(&archive_dir)?;

    let mut copied_files = 0;
    for filename in [
        "project-brief.md",
        "project-spec.json",
        "taskboard.json",
        "progress.txt",
    ] {
        let source = runtime_dir.join(filename);
        if source.exists() {
            fs::copy(&source, archive_dir.join(filename))?;
            copied_files += 1;
        }
    }

    let reviews_dir = runtime_dir.join("reviews");
    if reviews_dir.is_dir() {
        copied_files += copy_dir_contents(&reviews_dir, &archive_dir.join("reviews"))?;
    }

    Ok(Some(BackupSummary {
        archive_path: archive_dir.to_string_lossy().to_string(),
        copied_files,
    }))
}

fn copy_dir_contents(source: &Path, destination: &Path) -> AppResult<usize> {
    fs::create_dir_all(destination)?;
    let mut copied_files = 0;

    for file in walk_files(source) {
        let relative = file.strip_prefix(source).unwrap_or(&file);
        let target = destination.join(relative);
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(&file, target)?;
        copied_files += 1;
    }

    Ok(copied_files)
}

fn sanitize_archive_name(value: &str) -> String {
    value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '-'
            }
        })
        .collect()
}

fn unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::backup_runtime;

    #[test]
    fn backs_up_runtime_files() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-backup-test");
        let runtime = temp_dir.join("knot").join("runtime");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&runtime).expect("runtime should exist");
        std::fs::write(runtime.join("project-brief.md"), "brief").expect("brief");
        std::fs::write(
            runtime.join("project-spec.json"),
            r#"{"project_id":"backup-test"}"#,
        )
        .expect("spec");

        let summary = backup_runtime(&temp_dir)
            .expect("backup should not fail")
            .expect("backup should exist");

        assert!(PathBuf::from(&summary.archive_path)
            .join("project-brief.md")
            .exists());
        assert_eq!(summary.copied_files, 2);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    use std::path::PathBuf;
}
