use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    process::{ExitStatus, Stdio},
};
use tauri::Emitter;
use tokio::{
    io::{AsyncBufReadExt, AsyncRead, AsyncWriteExt, BufReader},
    process::Command,
};

use crate::{
    errors::AppResult,
    project_scan::{scan_project, ProjectScanSummary, ScanProjectRequest},
    runtime_staging::{stage_runtime_output, StagedRuntimeFile},
};

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateRuntimeRequest {
    pub project_path: String,
    pub cli: String,
    pub exclusions: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GenerateRuntimeResult {
    pub cli: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub staging_dir: Option<String>,
    pub files: Vec<StagedRuntimeFile>,
}

#[derive(Debug, Clone, Serialize)]
pub struct RuntimeGenerationLog {
    pub stream: String,
    pub line: String,
}

struct CliOutput {
    status: ExitStatus,
    stdout: String,
    stderr: String,
}

pub async fn generate_runtime_draft(
    app: tauri::AppHandle,
    request: GenerateRuntimeRequest,
) -> AppResult<GenerateRuntimeResult> {
    let scan = scan_project(ScanProjectRequest {
        project_path: request.project_path.clone(),
        exclusions: request.exclusions.clone(),
    });
    let prompt = build_generation_prompt(&scan)?;
    let output = run_ai_cli(app, &request.cli, &request.project_path, &prompt).await?;
    let exit_code = output.status.code().unwrap_or(-1);

    if !output.status.success() {
        return Ok(GenerateRuntimeResult {
            cli: request.cli,
            exit_code,
            stdout: output.stdout,
            stderr: output.stderr,
            staging_dir: None,
            files: Vec::new(),
        });
    }

    let staging = stage_runtime_output(&PathBuf::from(&request.project_path), &output.stdout)?;

    Ok(GenerateRuntimeResult {
        cli: request.cli,
        exit_code,
        stdout: output.stdout,
        stderr: output.stderr,
        staging_dir: Some(staging.staging_dir),
        files: staging.files,
    })
}

pub fn build_generation_prompt(scan: &ProjectScanSummary) -> AppResult<String> {
    let instructions = include_str!("../resources/prompts/runtime_generation.md");
    let scan_json = serde_json::to_string_pretty(scan)?;

    Ok(format!(
        "{instructions}\n\nProject scan summary:\n```json\n{scan_json}\n```\n"
    ))
}

async fn run_ai_cli(
    app: tauri::AppHandle,
    cli: &str,
    project_path: &str,
    prompt: &str,
) -> AppResult<CliOutput> {
    let mut command = Command::new(cli);
    command
        .current_dir(project_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    match cli {
        "claude" => {
            command.args(["-p", "--output-format", "text"]);
        }
        "amp" => {
            command.arg("-p");
        }
        _ => {
            command.arg("-p");
        }
    }

    let mut child = command.spawn()?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(prompt.as_bytes()).await?;
    }

    let stdout_task = child
        .stdout
        .take()
        .map(|stdout| tokio::spawn(read_stream(stdout, app.clone(), "stdout")));
    let stderr_task = child
        .stderr
        .take()
        .map(|stderr| tokio::spawn(read_stream(stderr, app.clone(), "stderr")));
    let status = child.wait().await?;

    Ok(CliOutput {
        status,
        stdout: join_stream(stdout_task).await?,
        stderr: join_stream(stderr_task).await?,
    })
}

async fn read_stream<R>(reader: R, app: tauri::AppHandle, stream: &'static str) -> AppResult<String>
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
            "runtime_generation_log",
            RuntimeGenerationLog {
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
    use super::build_generation_prompt;
    use crate::project_scan::ProjectScanSummary;

    #[test]
    fn prompt_contains_required_runtime_targets() {
        let prompt = build_generation_prompt(&ProjectScanSummary {
            project_path: "/tmp/project".to_string(),
            included_roots: vec!["script".to_string()],
            excluded_paths: vec!["node_modules".to_string()],
            recognized_files: vec!["README.md".to_string()],
            target_files: vec!["knot/runtime/taskboard.json".to_string()],
        })
        .expect("prompt");

        assert!(prompt.contains("project-brief.md"));
        assert!(prompt.contains("taskboard.json"));
        assert!(prompt.contains("script"));
    }
}
