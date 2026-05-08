use crate::errors::AppResult;
use serde::Serialize;
use std::{process::Stdio, sync::Mutex};
use tauri::Emitter;
use tokio::{
    io::{AsyncBufReadExt, AsyncRead, BufReader},
    process::Command,
};

#[derive(Default)]
pub struct ProcessState {
    active_pid: Mutex<Option<u32>>,
    stop_requested: Mutex<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProcessLogEvent {
    pub stream: String,
    pub line: String,
}

#[derive(Debug, Clone)]
pub struct ProcessOutput {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub stopped: bool,
}

impl ProcessState {
    pub fn set_pid(&self, pid: u32) -> AppResult<()> {
        let mut active = self
            .active_pid
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))?;
        *active = Some(pid);
        *self
            .stop_requested
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))? = false;
        Ok(())
    }

    pub fn clear_pid(&self) -> AppResult<()> {
        let mut active = self
            .active_pid
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))?;
        *active = None;
        Ok(())
    }

    pub fn pid(&self) -> AppResult<Option<u32>> {
        let active = self
            .active_pid
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))?;
        Ok(*active)
    }

    pub fn mark_stop_requested(&self) -> AppResult<()> {
        *self
            .stop_requested
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))? = true;
        Ok(())
    }

    pub fn stop_requested(&self) -> AppResult<bool> {
        let stopped = self
            .stop_requested
            .lock()
            .map_err(|err| std::io::Error::other(err.to_string()))?;
        Ok(*stopped)
    }
}

pub async fn run_logged_command(
    app: tauri::AppHandle,
    mut command: Command,
    event_name: &'static str,
) -> AppResult<ProcessOutput> {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = command.spawn()?;
    let stdout_task = child
        .stdout
        .take()
        .map(|stdout| tokio::spawn(read_stream(stdout, app.clone(), event_name, "stdout")));
    let stderr_task = child
        .stderr
        .take()
        .map(|stderr| tokio::spawn(read_stream(stderr, app.clone(), event_name, "stderr")));
    let status = child.wait().await?;

    Ok(ProcessOutput {
        exit_code: status.code().unwrap_or(-1),
        stdout: join_stream(stdout_task).await?,
        stderr: join_stream(stderr_task).await?,
        stopped: false,
    })
}

pub async fn run_managed_command(
    app: tauri::AppHandle,
    state: &ProcessState,
    mut command: Command,
    event_name: &'static str,
) -> AppResult<ProcessOutput> {
    if state.pid()?.is_some() {
        return Err(std::io::Error::other("已有 Knot loop 正在运行").into());
    }

    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = command.spawn()?;
    if let Some(pid) = child.id() {
        state.set_pid(pid)?;
    }

    let stdout_task = child
        .stdout
        .take()
        .map(|stdout| tokio::spawn(read_stream(stdout, app.clone(), event_name, "stdout")));
    let stderr_task = child
        .stderr
        .take()
        .map(|stderr| tokio::spawn(read_stream(stderr, app.clone(), event_name, "stderr")));
    let status = child.wait().await?;
    let stopped = state.stop_requested()?;
    state.clear_pid()?;

    Ok(ProcessOutput {
        exit_code: status.code().unwrap_or(-1),
        stdout: join_stream(stdout_task).await?,
        stderr: join_stream(stderr_task).await?,
        stopped,
    })
}

pub fn stop_pid(pid: u32) -> std::io::Result<bool> {
    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/T", "/F"])
        .status()?;

    #[cfg(not(target_os = "windows"))]
    let status = std::process::Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .status()?;

    Ok(status.success())
}

async fn read_stream<R>(
    reader: R,
    app: tauri::AppHandle,
    event_name: &'static str,
    stream: &'static str,
) -> AppResult<String>
where
    R: AsyncRead + Unpin,
{
    let mut reader = BufReader::new(reader);
    let mut output = String::new();

    loop {
        let mut line = String::new();
        let bytes = reader.read_line(&mut line).await?;
        if bytes == 0 {
            break;
        }
        output.push_str(&line);
        let _ = app.emit(
            event_name,
            ProcessLogEvent {
                stream: stream.to_string(),
                line: line.trim_end_matches(['\r', '\n']).to_string(),
            },
        );
    }

    Ok(output)
}

async fn join_stream(
    task: Option<tokio::task::JoinHandle<AppResult<String>>>,
) -> AppResult<String> {
    match task {
        Some(task) => task
            .await
            .map_err(|err| std::io::Error::other(err.to_string()))?,
        None => Ok(String::new()),
    }
}

#[cfg(test)]
mod tests {
    use super::ProcessState;

    #[test]
    fn process_state_tracks_pid() {
        let state = ProcessState::default();
        assert_eq!(state.pid().expect("pid"), None);
        state.set_pid(42).expect("set");
        assert_eq!(state.pid().expect("pid"), Some(42));
        state.mark_stop_requested().expect("mark");
        assert!(state.stop_requested().expect("stopped"));
        state.clear_pid().expect("clear");
        assert_eq!(state.pid().expect("pid"), None);
    }
}
