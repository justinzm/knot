use serde::Serialize;
use serde_json::Value;
use std::{fs, path::Path};

use crate::errors::AppResult;

#[derive(Debug, Clone, Serialize)]
pub struct StagedRuntimeFile {
    pub path: String,
    pub bytes: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct StagingResult {
    pub staging_dir: String,
    pub files: Vec<StagedRuntimeFile>,
}

pub fn stage_runtime_output(project_path: &Path, output: &str) -> AppResult<StagingResult> {
    let payload = parse_runtime_payload(output)?;
    let staging_dir = project_path.join("knot/runtime/.workbench-staging");
    fs::create_dir_all(&staging_dir)?;

    let files = vec![
        write_stage_file(
            &staging_dir,
            "project-brief.md",
            value_as_text(&payload, "project-brief.md")?,
        )?,
        write_stage_file(
            &staging_dir,
            "project-spec.json",
            value_as_json_text(&payload, "project-spec.json")?,
        )?,
        write_stage_file(
            &staging_dir,
            "taskboard.json",
            value_as_json_text(&payload, "taskboard.json")?,
        )?,
        write_stage_file(
            &staging_dir,
            "progress.txt",
            value_as_text(&payload, "progress.txt")?,
        )?,
    ];

    Ok(StagingResult {
        staging_dir: staging_dir.to_string_lossy().to_string(),
        files,
    })
}

pub fn parse_runtime_payload(output: &str) -> AppResult<Value> {
    let trimmed = output.trim();
    let json_text = if trimmed.starts_with('{') {
        trimmed
    } else {
        extract_json_object(trimmed).unwrap_or(trimmed)
    };

    Ok(serde_json::from_str(json_text)?)
}

fn extract_json_object(output: &str) -> Option<&str> {
    let start = output.find('{')?;
    let end = output.rfind('}')?;
    output.get(start..=end)
}

fn value_as_text(payload: &Value, key: &str) -> AppResult<String> {
    Ok(payload
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string())
}

fn value_as_json_text(payload: &Value, key: &str) -> AppResult<String> {
    let value = payload
        .get(key)
        .cloned()
        .unwrap_or(Value::Object(Default::default()));
    Ok(format!("{}\n", serde_json::to_string_pretty(&value)?))
}

fn write_stage_file(dir: &Path, filename: &str, contents: String) -> AppResult<StagedRuntimeFile> {
    let path = dir.join(filename);
    fs::write(&path, contents.as_bytes())?;

    Ok(StagedRuntimeFile {
        path: path.to_string_lossy().to_string(),
        bytes: contents.len(),
    })
}

#[cfg(test)]
mod tests {
    use super::{parse_runtime_payload, stage_runtime_output};

    #[test]
    fn parses_json_from_wrapped_output() {
        let value = parse_runtime_payload(
            r#"Result:
            {"project-brief.md":"brief","project-spec.json":{"project_id":"x"},"taskboard.json":{"stories":[]},"progress.txt":"progress"}"#,
        )
        .expect("payload");

        assert_eq!(value["project-spec.json"]["project_id"], "x");
    }

    #[test]
    fn writes_staging_files() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-staging-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        let output = r#"{"project-brief.md":"brief","project-spec.json":{"project_id":"x"},"taskboard.json":{"stories":[]},"progress.txt":"progress"}"#;

        let result = stage_runtime_output(&temp_dir, output).expect("staging");

        assert_eq!(result.files.len(), 4);
        assert!(temp_dir
            .join("knot/runtime/.workbench-staging/taskboard.json")
            .exists());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
