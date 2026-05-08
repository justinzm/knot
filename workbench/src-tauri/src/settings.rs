use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf, time::SystemTime};

use crate::errors::{AppError, AppResult};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AppSettings {
    pub default_cli: String,
    pub max_iterations: u32,
    pub scan_exclusions: Vec<String>,
    pub theme: String,
    pub template_source: String,
    pub recent_projects: Vec<RecentProject>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_cli: "claude".to_string(),
            max_iterations: 10,
            scan_exclusions: vec![
                ".git".to_string(),
                "node_modules".to_string(),
                "knot/runtime/archive".to_string(),
            ],
            theme: "dark".to_string(),
            template_source: "bundled".to_string(),
            recent_projects: Vec::new(),
        }
    }
}

pub fn load_settings() -> AppResult<AppSettings> {
    let path = settings_file()?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let contents = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&contents)?)
}

pub fn save_settings(settings: AppSettings) -> AppResult<AppSettings> {
    let path = settings_file()?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let contents = serde_json::to_string_pretty(&settings)?;
    fs::write(path, contents)?;
    Ok(settings)
}

pub fn remember_project(path: String) -> AppResult<AppSettings> {
    let mut settings = load_settings()?;
    let project_path = PathBuf::from(&path);
    let name = project_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("未命名项目")
        .to_string();
    let last_opened = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    settings
        .recent_projects
        .retain(|project| project.path != path);
    settings.recent_projects.insert(
        0,
        RecentProject {
            path,
            name,
            last_opened,
        },
    );
    settings.recent_projects.truncate(8);

    save_settings(settings)
}

fn settings_file() -> AppResult<PathBuf> {
    let dir = env::var("KNOT_WORKBENCH_SETTINGS_DIR")
        .map(PathBuf::from)
        .or_else(|_| dirs::config_dir().ok_or(AppError::MissingConfigDir))?;

    Ok(dir.join("Knot Workbench").join("settings.json"))
}

#[cfg(test)]
mod tests {
    use super::{load_settings, remember_project, save_settings, AppSettings};

    #[test]
    fn settings_round_trip_preserves_recent_project() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-settings-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::env::set_var("KNOT_WORKBENCH_SETTINGS_DIR", &temp_dir);

        let settings = AppSettings {
            default_cli: "amp".to_string(),
            max_iterations: 5,
            ..AppSettings::default()
        };

        save_settings(settings).expect("settings should save");
        remember_project("/tmp/example-project".to_string()).expect("project should persist");
        let loaded = load_settings().expect("settings should load");

        assert_eq!(loaded.default_cli, "amp");
        assert_eq!(loaded.max_iterations, 5);
        assert_eq!(loaded.recent_projects[0].path, "/tmp/example-project");

        let _ = std::fs::remove_dir_all(&temp_dir);
        std::env::remove_var("KNOT_WORKBENCH_SETTINGS_DIR");
    }
}
