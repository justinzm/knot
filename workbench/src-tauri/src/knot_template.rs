use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::{
    backup::{backup_runtime, BackupSummary},
    errors::AppResult,
    project::{inspect_project, ProjectSummary},
    runtime_detect::RuntimeKind,
};

#[derive(Debug, Serialize)]
pub struct TemplateSummary {
    pub template_path: String,
    pub has_core: bool,
    pub has_automation: bool,
    pub has_runtime: bool,
    pub runtime_files: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct InstallTemplateRequest {
    pub project_path: String,
    pub backup_existing_runtime: bool,
    pub allow_production: bool,
}

#[derive(Debug, Serialize)]
pub struct InstallTemplateResult {
    pub project: ProjectSummary,
    pub backup: Option<BackupSummary>,
    pub copied_files: usize,
}

pub fn template_summary() -> TemplateSummary {
    let template = template_root();
    let runtime_dir = template.join("runtime");
    let runtime_files = [
        "project-brief.md",
        "project-spec.json",
        "taskboard.json",
        "progress.txt",
    ]
    .iter()
    .filter(|filename| runtime_dir.join(filename).exists())
    .map(|filename| filename.to_string())
    .collect();

    TemplateSummary {
        template_path: template.to_string_lossy().to_string(),
        has_core: template.join("core").is_dir(),
        has_automation: template.join("automation").is_dir(),
        has_runtime: runtime_dir.is_dir(),
        runtime_files,
    }
}

pub fn install_template(request: InstallTemplateRequest) -> AppResult<InstallTemplateResult> {
    let project_path = PathBuf::from(&request.project_path);
    ensure_writable(&project_path)?;

    let before = inspect_project(request.project_path.clone());
    if before.runtime_kind == RuntimeKind::Production && !request.allow_production {
        return Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "检测到生产 runtime，需要先选择备份后替换或原地刷新",
        )
        .into());
    }

    let backup = if request.backup_existing_runtime {
        backup_runtime(&project_path)?
    } else {
        None
    };
    let copied_files = copy_template_into_project(&project_path)?;
    let project = inspect_project(request.project_path);

    Ok(InstallTemplateResult {
        project,
        backup,
        copied_files,
    })
}

fn copy_template_into_project(project_path: &Path) -> AppResult<usize> {
    let template = template_root();
    let target = project_path.join("knot");
    fs::create_dir_all(&target)?;

    let mut copied_files = 0;
    copied_files += replace_dir(&template.join("core"), &target.join("core"))?;
    copied_files += replace_dir(&template.join("automation"), &target.join("automation"))?;
    copied_files += replace_dir(&template.join("examples"), &target.join("examples"))?;
    copied_files += copy_dir_contents(&template.join("runtime"), &target.join("runtime"))?;

    make_runner_executable(&target.join("core").join("knot.sh"))?;
    Ok(copied_files)
}

fn replace_dir(source: &Path, destination: &Path) -> AppResult<usize> {
    if destination.exists() {
        fs::remove_dir_all(destination)?;
    }
    copy_dir_contents(source, destination)
}

fn copy_dir_contents(source: &Path, destination: &Path) -> AppResult<usize> {
    fs::create_dir_all(destination)?;
    let mut copied_files = 0;

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let source_path = entry.path();
        let target_path = destination.join(entry.file_name());
        if source_path.is_dir() {
            copied_files += copy_dir_contents(&source_path, &target_path)?;
        } else {
            fs::copy(&source_path, &target_path)?;
            copied_files += 1;
        }
    }

    Ok(copied_files)
}

fn ensure_writable(project_path: &Path) -> AppResult<()> {
    fs::create_dir_all(project_path)?;
    let test_file = project_path.join(".knot-workbench-write-test");
    fs::write(&test_file, "ok")?;
    fs::remove_file(test_file)?;
    Ok(())
}

fn template_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/knot-template")
}

#[cfg(unix)]
fn make_runner_executable(path: &Path) -> AppResult<()> {
    use std::os::unix::fs::PermissionsExt;

    let mut permissions = fs::metadata(path)?.permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(path, permissions)?;
    Ok(())
}

#[cfg(not(unix))]
fn make_runner_executable(_path: &Path) -> AppResult<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{install_template, template_summary, InstallTemplateRequest};

    #[test]
    fn template_contains_runtime_files() {
        let summary = template_summary();

        assert!(summary.has_core);
        assert!(summary.has_automation);
        assert!(summary
            .runtime_files
            .contains(&"taskboard.json".to_string()));
    }

    #[test]
    fn installs_template_into_plain_project() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-install-test");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).expect("project should exist");

        let result = install_template(InstallTemplateRequest {
            project_path: temp_dir.to_string_lossy().to_string(),
            backup_existing_runtime: false,
            allow_production: false,
        })
        .expect("template should install");

        assert!(result.project.has_core);
        assert!(result.project.has_automation);
        assert!(temp_dir.join("knot/runtime/taskboard.json").exists());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn refuses_to_overwrite_production_without_permission() {
        let temp_dir = std::env::temp_dir().join("knot-workbench-production-test");
        let runtime = temp_dir.join("knot").join("runtime");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&runtime).expect("runtime should exist");
        std::fs::write(
            runtime.join("project-spec.json"),
            r#"{"project_id":"real-project"}"#,
        )
        .expect("spec");
        std::fs::write(runtime.join("taskboard.json"), r#"{"stories":[{}]}"#).expect("taskboard");

        let result = install_template(InstallTemplateRequest {
            project_path: temp_dir.to_string_lossy().to_string(),
            backup_existing_runtime: false,
            allow_production: false,
        });

        assert!(result.is_err());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
