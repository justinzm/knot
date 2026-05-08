use crate::{
    errors::AppResult,
    process_manager::{run_managed_command, stop_pid, ProcessState},
    project::{inspect_project, ProjectSummary},
};
use serde::{Deserialize, Serialize};
use tokio::process::Command;

const COMPLETE_TOKEN: &str = "<promise>COMPLETE</promise>";

#[derive(Debug, Clone, Deserialize)]
pub struct StartLoopRequest {
    pub project_path: String,
    pub cli: String,
    pub max_iterations: u32,
}

#[derive(Debug, Serialize)]
pub struct LoopResult {
    pub status: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub completed: bool,
    pub project: ProjectSummary,
}

pub async fn start_loop(
    app: tauri::AppHandle,
    state: &ProcessState,
    request: StartLoopRequest,
) -> AppResult<LoopResult> {
    let mut command = Command::new("./knot/core/knot.sh");
    command.current_dir(&request.project_path).args([
        "--tool",
        &request.cli,
        &request.max_iterations.to_string(),
    ]);

    let output = run_managed_command(app, state, command, "knot_loop_log").await?;
    let combined = format!("{}\n{}", output.stdout, output.stderr);
    let completed = combined.contains(COMPLETE_TOKEN);
    let status = loop_status(output.exit_code, completed, output.stopped);
    let project = inspect_project(request.project_path);

    Ok(LoopResult {
        status,
        exit_code: output.exit_code,
        stdout: output.stdout,
        stderr: output.stderr,
        completed,
        project,
    })
}

pub fn stop_loop(state: &ProcessState) -> AppResult<bool> {
    let Some(pid) = state.pid()? else {
        return Ok(false);
    };
    state.mark_stop_requested()?;
    let stopped = stop_pid(pid)?;
    state.clear_pid()?;
    Ok(stopped)
}

fn loop_status(exit_code: i32, completed: bool, stopped: bool) -> String {
    if stopped {
        "stopped".to_string()
    } else if completed {
        "completed".to_string()
    } else if exit_code == 0 {
        "stopped".to_string()
    } else {
        "failed".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::loop_status;

    #[test]
    fn completed_token_wins_status() {
        assert_eq!(loop_status(0, true, false), "completed");
        assert_eq!(loop_status(1, false, false), "failed");
        assert_eq!(loop_status(-1, false, true), "stopped");
    }
}
