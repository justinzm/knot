use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("Knot root not found under {0}")]
    KnotRootNotFound(String),
    #[error("file operation failed: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeLocation {
    pub project_root: PathBuf,
    pub knot_root: PathBuf,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSnapshot {
    pub knot_root: PathBuf,
    pub project_brief: String,
    pub project_spec_json: String,
    pub taskboard_json: String,
    pub progress_text: String,
}

pub fn discover_runtime(project_root: &Path) -> Result<RuntimeLocation, RuntimeError> {
    let direct = project_root;
    if is_knot_root(direct) {
        return Ok(RuntimeLocation {
            project_root: project_root.to_path_buf(),
            knot_root: direct.to_path_buf(),
        });
    }

    let nested = project_root.join("knot");
    if is_knot_root(&nested) {
        return Ok(RuntimeLocation {
            project_root: project_root.to_path_buf(),
            knot_root: nested,
        });
    }

    Err(RuntimeError::KnotRootNotFound(
        project_root.display().to_string(),
    ))
}

pub fn read_runtime_snapshot(knot_root: &Path) -> Result<RuntimeSnapshot, RuntimeError> {
    let runtime = knot_root.join("runtime");
    Ok(RuntimeSnapshot {
        knot_root: knot_root.to_path_buf(),
        project_brief: read_optional(runtime.join("project-brief.md"))?,
        project_spec_json: read_optional(runtime.join("project-spec.json"))?,
        taskboard_json: read_optional(runtime.join("taskboard.json"))?,
        progress_text: read_optional(runtime.join("progress.txt"))?,
    })
}

pub fn write_atomic(path: &Path, contents: &str) -> Result<(), RuntimeError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let temp_path = path.with_extension("tmp");
    {
        let mut file = fs::File::create(&temp_path)?;
        file.write_all(contents.as_bytes())?;
        file.sync_all()?;
    }
    fs::rename(temp_path, path)?;
    Ok(())
}

fn is_knot_root(path: &Path) -> bool {
    path.join("runtime").is_dir()
        && path.join("automation").join("schemas").is_dir()
        && path.join("core").is_dir()
}

fn read_optional(path: PathBuf) -> Result<String, RuntimeError> {
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok(String::new())
    }
}
