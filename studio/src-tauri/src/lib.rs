pub mod commands;
pub mod process;
pub mod runtime;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_runtime,
            commands::save_project_brief,
            commands::save_project_spec,
            commands::save_taskboard,
            commands::run_preflight,
            commands::list_artifacts,
            commands::run_loop_once
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
