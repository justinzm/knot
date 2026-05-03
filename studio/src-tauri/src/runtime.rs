use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tempfile::NamedTempFile;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("Knot root not found under {0}")]
    KnotRootNotFound(String),
    #[error("{operation} failed for {path}: {source}")]
    PathIo {
        operation: &'static str,
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
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
    let parent = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));

    fs::create_dir_all(parent).map_err(|source| RuntimeError::PathIo {
        operation: "create parent directory",
        path: path.to_path_buf(),
        source,
    })?;

    let mut file = NamedTempFile::new_in(parent).map_err(|source| RuntimeError::PathIo {
        operation: "create temporary file",
        path: parent.to_path_buf(),
        source,
    })?;

    file.write_all(contents.as_bytes())
        .map_err(|source| RuntimeError::PathIo {
            operation: "write temporary file",
            path: file.path().to_path_buf(),
            source,
        })?;
    file.as_file()
        .sync_all()
        .map_err(|source| RuntimeError::PathIo {
            operation: "sync temporary file",
            path: file.path().to_path_buf(),
            source,
        })?;

    file.persist(path).map_err(|error| RuntimeError::PathIo {
        operation: "persist temporary file",
        path: path.to_path_buf(),
        source: error.error,
    })?;

    Ok(())
}

fn io_error(
    operation: &'static str,
    path: impl Into<PathBuf>,
    source: std::io::Error,
) -> RuntimeError {
    RuntimeError::PathIo {
        operation,
        path: path.into(),
        source,
    }
}

fn is_knot_root(path: &Path) -> bool {
    path.join("runtime").is_dir()
        && path.join("runtime").join("taskboard.json").is_file()
        && path.join("core").join("knot.sh").is_file()
        && path
            .join("automation")
            .join("schemas")
            .join("taskboard.schema.json")
            .is_file()
        && path
            .join("automation")
            .join("scripts")
            .join("run_preflight.py")
            .is_file()
}

fn read_optional(path: PathBuf) -> Result<String, RuntimeError> {
    if path.exists() {
        fs::read_to_string(&path).map_err(|source| io_error("read runtime file", path, source))
    } else {
        Ok(String::new())
    }
}
