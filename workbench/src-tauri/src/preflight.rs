use crate::{errors::AppResult, process_manager::run_logged_command};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};
use tokio::process::Command;

#[derive(Debug, Clone, Deserialize)]
pub struct PreflightRequest {
    pub project_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PreflightCheck {
    pub name: String,
    pub status: String,
    pub input: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PreflightResult {
    pub ok: bool,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub report: Option<Value>,
    pub checks: Vec<PreflightCheck>,
}

pub async fn run_preflight(
    app: tauri::AppHandle,
    request: PreflightRequest,
) -> AppResult<PreflightResult> {
    let project_path = PathBuf::from(&request.project_path);
    let python = find_python();
    let mut command = Command::new(python);
    command.current_dir(&project_path).args([
        "knot/automation/scripts/run_preflight.py",
        "--knot-dir",
        "knot",
    ]);

    let output = run_logged_command(app, command, "preflight_log").await?;
    let report = read_latest_report(&project_path);
    let checks = report.as_ref().map(extract_checks).unwrap_or_default();
    let report_passed = report
        .as_ref()
        .and_then(|value| value.get("status"))
        .and_then(Value::as_str)
        == Some("pass");

    Ok(PreflightResult {
        ok: output.exit_code == 0 && report_passed,
        exit_code: output.exit_code,
        stdout: output.stdout,
        stderr: output.stderr,
        report,
        checks,
    })
}

fn find_python() -> &'static str {
    for python in ["python3", "python", "python.exe"] {
        if std::process::Command::new(python)
            .arg("--version")
            .output()
            .is_ok()
        {
            return python;
        }
    }
    "python3"
}

fn read_latest_report(project_path: &std::path::Path) -> Option<Value> {
    let path = project_path.join("knot/runtime/reviews/preflight/latest.json");
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
}

fn extract_checks(report: &Value) -> Vec<PreflightCheck> {
    report
        .get("checks")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .map(|check| PreflightCheck {
            name: text(&check, "name"),
            status: text(&check, "status"),
            input: text(&check, "input"),
            message: text(&check, "message"),
        })
        .collect()
}

fn text(value: &Value, field: &str) -> String {
    value
        .get(field)
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::extract_checks;
    use serde_json::json;

    #[test]
    fn extracts_preflight_checks() {
        let checks = extract_checks(&json!({
            "checks": [{"name": "taskboard", "status": "fail", "input": "runtime/taskboard.json", "message": "bad"}]
        }));

        assert_eq!(checks[0].name, "taskboard");
        assert_eq!(checks[0].status, "fail");
    }
}
