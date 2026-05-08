use crate::{errors::AppResult, path_validation::RuntimeValidationIssue};
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

pub fn validate_runtime_schemas(
    project_path: &Path,
    project_spec: &Value,
    taskboard: &Value,
) -> AppResult<Vec<RuntimeValidationIssue>> {
    let mut issues = Vec::new();
    issues.extend(validate_schema(
        project_path,
        "project-spec.json",
        "project-spec.schema.json",
        project_spec,
    )?);
    issues.extend(validate_schema(
        project_path,
        "taskboard.json",
        "taskboard.schema.json",
        taskboard,
    )?);
    Ok(issues)
}

fn validate_schema(
    project_path: &Path,
    file: &str,
    schema: &str,
    value: &Value,
) -> AppResult<Vec<RuntimeValidationIssue>> {
    let knot_dir = project_path.join("knot");
    let script = knot_dir.join("automation/scripts/validate_schema.py");
    let schema_path = knot_dir.join("automation/schemas").join(schema);
    let input_path = write_temp_json(value)?;
    let output = run_python_validator(&script, &schema_path, &input_path);
    let _ = fs::remove_file(&input_path);

    match output {
        Ok(output) if output.status.success() => Ok(Vec::new()),
        Ok(output) => Ok(vec![RuntimeValidationIssue {
            file: file.to_string(),
            field: "schema".to_string(),
            story_id: None,
            message: schema_message(&output.stdout, &output.stderr),
        }]),
        Err(error) => Ok(vec![RuntimeValidationIssue {
            file: file.to_string(),
            field: "schema".to_string(),
            story_id: None,
            message: format!("无法运行 schema 校验：{error}"),
        }]),
    }
}

fn run_python_validator(
    script: &Path,
    schema_path: &Path,
    input_path: &Path,
) -> std::io::Result<std::process::Output> {
    for python in ["python3", "python", "python.exe"] {
        let output = Command::new(python)
            .arg(script)
            .arg("--schema")
            .arg(schema_path)
            .arg("--input")
            .arg(input_path)
            .output();
        if output.is_ok() {
            return output;
        }
    }

    Command::new("python3").arg("--version").output()
}

fn write_temp_json(value: &Value) -> AppResult<PathBuf> {
    let name = format!(
        "knot-workbench-schema-{}-{}.json",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    );
    let path = std::env::temp_dir().join(name);
    fs::write(&path, serde_json::to_string_pretty(value)?)?;
    Ok(path)
}

fn schema_message(stdout: &[u8], stderr: &[u8]) -> String {
    let stdout = String::from_utf8_lossy(stdout);
    let stderr = String::from_utf8_lossy(stderr);
    [stdout.trim(), stderr.trim()]
        .into_iter()
        .filter(|item| !item.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::schema_message;

    #[test]
    fn joins_schema_output() {
        assert_eq!(
            schema_message(b"schema failed", b"detail"),
            "schema failed\ndetail"
        );
    }
}
