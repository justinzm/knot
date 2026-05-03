use serde::Serialize;
use std::path::Path;
use std::process::{Command, Output};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProcessError {
    #[error("process failed to start: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandRunResult {
    pub status: String,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

pub fn run_preflight_process(knot_root: &Path) -> Result<CommandRunResult, ProcessError> {
    let output = Command::new("python3")
        .arg("automation/scripts/run_preflight.py")
        .arg("--knot-dir")
        .arg(".")
        .current_dir(knot_root)
        .output()?;

    Ok(command_run_result(output))
}

pub fn run_loop_process(
    knot_root: &Path,
    tool: &str,
    max_iterations: u32,
) -> Result<CommandRunResult, ProcessError> {
    let output = Command::new("./core/knot.sh")
        .arg("--tool")
        .arg(tool)
        .arg(max_iterations.to_string())
        .current_dir(knot_root)
        .output()?;

    Ok(command_run_result(output))
}

fn command_run_result(output: Output) -> CommandRunResult {
    CommandRunResult {
        status: if output.status.success() {
            "pass".to_string()
        } else {
            "fail".to_string()
        },
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    }
}
