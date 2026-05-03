pub mod commands;
pub mod runtime;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::open_runtime,
            commands::save_project_brief,
            commands::save_project_spec,
            commands::save_taskboard
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
