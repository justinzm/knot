use serde::Serialize;
use std::{process::Command, time::Duration};

#[derive(Debug, Serialize)]
pub struct CliStatus {
    pub name: String,
    pub available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

pub fn detect_ai_clis() -> Vec<CliStatus> {
    ["claude", "amp"]
        .iter()
        .map(|name| detect_cli(name))
        .collect()
}

fn detect_cli(name: &str) -> CliStatus {
    let output = Command::new(name).arg("--version").output();

    match output {
        Ok(output) => {
            let raw = if output.stdout.is_empty() {
                String::from_utf8_lossy(&output.stderr).to_string()
            } else {
                String::from_utf8_lossy(&output.stdout).to_string()
            };
            let version = raw
                .lines()
                .next()
                .map(str::trim)
                .filter(|line| !line.is_empty());

            CliStatus {
                name: name.to_string(),
                available: true,
                version: version.map(ToString::to_string),
                error: None,
            }
        }
        Err(error) => CliStatus {
            name: name.to_string(),
            available: false,
            version: None,
            error: Some(error.to_string()),
        },
    }
}

#[allow(dead_code)]
fn _short_detection_window() -> Duration {
    Duration::from_secs(3)
}
