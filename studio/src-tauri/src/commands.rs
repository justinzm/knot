use std::path::PathBuf;

use crate::process::{run_loop_process, run_preflight_process, CommandRunResult};
use crate::runtime::{
    discover_runtime, read_runtime_snapshot, validate_knot_root, write_atomic, RuntimeSnapshot,
};

#[tauri::command]
pub fn open_runtime(project_root: String) -> Result<RuntimeSnapshot, String> {
    let location =
        discover_runtime(&PathBuf::from(project_root)).map_err(|error| error.to_string())?;
    read_runtime_snapshot(&location.knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_brief(knot_root: String, contents: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    validate_knot_root(&knot_root).map_err(|error| error.to_string())?;
    write_atomic(&knot_root.join("runtime/project-brief.md"), &contents)
        .map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_spec(knot_root: String, json: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    validate_knot_root(&knot_root).map_err(|error| error.to_string())?;
    write_atomic(&knot_root.join("runtime/project-spec.json"), &json)
        .map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_taskboard(knot_root: String, json: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    validate_knot_root(&knot_root).map_err(|error| error.to_string())?;
    write_atomic(&knot_root.join("runtime/taskboard.json"), &json)
        .map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn run_preflight(knot_root: String) -> Result<CommandRunResult, String> {
    let knot_root = PathBuf::from(knot_root);
    validate_knot_root(&knot_root).map_err(|error| error.to_string())?;
    run_preflight_process(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn run_loop_once(
    knot_root: String,
    tool: String,
    max_iterations: u32,
) -> Result<CommandRunResult, String> {
    let knot_root = PathBuf::from(knot_root);
    validate_knot_root(&knot_root).map_err(|error| error.to_string())?;

    if tool != "claude" && tool != "amp" {
        return Err(format!("Unsupported tool: {tool}"));
    }
    if max_iterations == 0 {
        return Err("maxIterations must be greater than 0".to_string());
    }

    run_loop_process(&knot_root, &tool, max_iterations).map_err(|error| error.to_string())
}
