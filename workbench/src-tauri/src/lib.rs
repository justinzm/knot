mod ai_cli;
mod artifacts;
mod backup;
mod cli;
mod errors;
mod knot_loop;
mod knot_template;
mod path_validation;
mod preflight;
pub mod process_manager;
mod progress;
mod project;
mod project_scan;
pub mod runtime_detect;
pub mod runtime_io;
mod runtime_staging;
mod schema_validation;
mod settings;

use errors::to_command_error;
use process_manager::ProcessState;
use serde::Serialize;
use settings::AppSettings;

#[derive(Debug, Serialize)]
struct AppStatus {
    product_name: &'static str,
    phase: &'static str,
    rust_bridge: bool,
}

#[tauri::command]
fn get_app_status() -> AppStatus {
    AppStatus {
        product_name: "Knot Workbench",
        phase: "第 10 阶段",
        rust_bridge: true,
    }
}

#[tauri::command]
fn get_settings() -> Result<AppSettings, String> {
    settings::load_settings().map_err(to_command_error)
}

#[tauri::command]
fn save_settings(settings: AppSettings) -> Result<AppSettings, String> {
    settings::save_settings(settings).map_err(to_command_error)
}

#[tauri::command]
fn remember_project(path: String) -> Result<AppSettings, String> {
    settings::remember_project(path).map_err(to_command_error)
}

#[tauri::command]
fn inspect_project(path: String) -> project::ProjectSummary {
    project::inspect_project(path)
}

#[tauri::command]
fn detect_ai_clis() -> Vec<cli::CliStatus> {
    cli::detect_ai_clis()
}

#[tauri::command]
fn get_template_summary() -> knot_template::TemplateSummary {
    knot_template::template_summary()
}

#[tauri::command]
fn install_knot_template(
    request: knot_template::InstallTemplateRequest,
) -> Result<knot_template::InstallTemplateResult, String> {
    knot_template::install_template(request).map_err(to_command_error)
}

#[tauri::command]
fn scan_project(request: project_scan::ScanProjectRequest) -> project_scan::ProjectScanSummary {
    project_scan::scan_project(request)
}

#[tauri::command]
async fn generate_runtime_draft(
    app: tauri::AppHandle,
    request: ai_cli::GenerateRuntimeRequest,
) -> Result<ai_cli::GenerateRuntimeResult, String> {
    ai_cli::generate_runtime_draft(app, request)
        .await
        .map_err(to_command_error)
}

#[tauri::command]
fn save_runtime_draft(
    request: runtime_io::RuntimeSaveRequest,
) -> Result<runtime_io::RuntimeSaveResult, String> {
    runtime_io::save_runtime(request).map_err(to_command_error)
}

#[tauri::command]
async fn run_preflight(
    app: tauri::AppHandle,
    request: preflight::PreflightRequest,
) -> Result<preflight::PreflightResult, String> {
    preflight::run_preflight(app, request)
        .await
        .map_err(to_command_error)
}

#[tauri::command]
async fn start_knot_loop(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProcessState>,
    request: knot_loop::StartLoopRequest,
) -> Result<knot_loop::LoopResult, String> {
    knot_loop::start_loop(app, &state, request)
        .await
        .map_err(to_command_error)
}

#[tauri::command]
fn stop_knot_loop(state: tauri::State<'_, ProcessState>) -> Result<bool, String> {
    knot_loop::stop_loop(&state).map_err(to_command_error)
}

#[tauri::command]
fn read_artifacts(
    request: artifacts::ArtifactsRequest,
) -> Result<artifacts::ArtifactsSnapshot, String> {
    artifacts::read_artifacts(request).map_err(to_command_error)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ProcessState::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            get_settings,
            save_settings,
            remember_project,
            inspect_project,
            detect_ai_clis,
            get_template_summary,
            install_knot_template,
            scan_project,
            generate_runtime_draft,
            save_runtime_draft,
            run_preflight,
            start_knot_loop,
            stop_knot_loop,
            read_artifacts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{get_app_status, inspect_project};

    #[test]
    fn app_status_reports_workbench_bridge() {
        let status = get_app_status();

        assert_eq!(status.product_name, "Knot Workbench");
        assert_eq!(status.phase, "第 10 阶段");
        assert!(status.rust_bridge);
    }

    #[test]
    fn inspect_project_command_reports_missing_runtime() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-command-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).expect("temp project should exist");

        let summary = inspect_project(temp_dir.to_string_lossy().to_string());

        assert!(!summary.has_knot_dir);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
