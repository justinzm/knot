import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ArtifactsSnapshot } from "../knot/artifacts";
import type { ProjectSpec, Taskboard } from "../knot/types";

interface WorkbenchStatusResponse {
  product_name: string;
  phase: string;
  rust_bridge: boolean;
}

export interface WorkbenchStatus {
  productName: string;
  phase: string;
  rustBridge: boolean;
}

export interface RecentProject {
  path: string;
  name: string;
  last_opened: number;
}

export interface AppSettings {
  default_cli: string;
  max_iterations: number;
  scan_exclusions: string[];
  theme: "dark" | "light";
  template_source: string;
  recent_projects: RecentProject[];
}

export interface ProjectSummary {
  path: string;
  name: string;
  has_knot_dir: boolean;
  has_core: boolean;
  has_automation: boolean;
  has_runtime: boolean;
  runtime_kind: RuntimeKind;
  project_id: string | null;
  story_count: number;
  progress_entries: number;
  review_count: number;
}

export type RuntimeKind = "missing" | "empty" | "demo" | "production";

export interface CliStatus {
  name: "claude" | "amp";
  available: boolean;
  version: string | null;
  error: string | null;
}

export interface TemplateSummary {
  template_path: string;
  has_core: boolean;
  has_automation: boolean;
  has_runtime: boolean;
  runtime_files: string[];
}

export interface InstallTemplateRequest {
  project_path: string;
  backup_existing_runtime: boolean;
  allow_production: boolean;
}

export interface BackupSummary {
  archive_path: string;
  copied_files: number;
}

export interface InstallTemplateResult {
  project: ProjectSummary;
  backup: BackupSummary | null;
  copied_files: number;
}

export interface ProjectScanRequest {
  project_path: string;
  exclusions: string[];
}

export interface ProjectScanSummary {
  project_path: string;
  included_roots: string[];
  excluded_paths: string[];
  recognized_files: string[];
  target_files: string[];
}

export interface GenerateRuntimeRequest {
  project_path: string;
  cli: string;
  exclusions: string[];
}

export interface StagedRuntimeFile {
  path: string;
  bytes: number;
}

export interface GenerateRuntimeResult {
  cli: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  staging_dir: string | null;
  files: StagedRuntimeFile[];
}

export interface RuntimeGenerationLogEvent {
  stream: "stdout" | "stderr";
  line: string;
}

export interface RuntimeValidationIssue {
  file: string;
  field: string;
  story_id: string | null;
  message: string;
}

export interface RuntimeSaveRequest {
  project_path: string;
  brief: string;
  project_spec: ProjectSpec;
  taskboard: Taskboard;
}

export interface RuntimeSaveResult {
  ok: boolean;
  issues: RuntimeValidationIssue[];
  written_files: string[];
  snapshot_dir: string | null;
}

export interface ProcessLogEvent {
  stream: "stdout" | "stderr";
  line: string;
}

export interface PreflightCheck {
  name: string;
  status: string;
  input: string;
  message: string;
}

export interface PreflightResult {
  ok: boolean;
  exit_code: number;
  stdout: string;
  stderr: string;
  report: unknown | null;
  checks: PreflightCheck[];
}

export interface LoopResult {
  status: "completed" | "failed" | "stopped";
  exit_code: number;
  stdout: string;
  stderr: string;
  completed: boolean;
  project: ProjectSummary;
}

export async function getWorkbenchStatus(): Promise<WorkbenchStatus> {
  const response = await invoke<WorkbenchStatusResponse>("get_app_status");

  return {
    productName: response.product_name,
    phase: response.phase,
    rustBridge: response.rust_bridge,
  };
}

export function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

export function saveSettings(settings: AppSettings): Promise<AppSettings> {
  return invoke<AppSettings>("save_settings", { settings });
}

export function rememberProject(path: string): Promise<AppSettings> {
  return invoke<AppSettings>("remember_project", { path });
}

export function inspectProject(path: string): Promise<ProjectSummary> {
  return invoke<ProjectSummary>("inspect_project", { path });
}

export function detectAiClis(): Promise<CliStatus[]> {
  return invoke<CliStatus[]>("detect_ai_clis");
}

export function getTemplateSummary(): Promise<TemplateSummary> {
  return invoke<TemplateSummary>("get_template_summary");
}

export function installKnotTemplate(
  request: InstallTemplateRequest,
): Promise<InstallTemplateResult> {
  return invoke<InstallTemplateResult>("install_knot_template", { request });
}

export function scanProject(request: ProjectScanRequest): Promise<ProjectScanSummary> {
  return invoke<ProjectScanSummary>("scan_project", { request });
}

export async function generateRuntimeDraft(
  request: GenerateRuntimeRequest,
  onLog?: (event: RuntimeGenerationLogEvent) => void,
): Promise<GenerateRuntimeResult> {
  const unlisten = onLog
    ? await listen<RuntimeGenerationLogEvent>("runtime_generation_log", (event) => {
        onLog(event.payload);
      })
    : undefined;

  try {
    return await invoke<GenerateRuntimeResult>("generate_runtime_draft", { request });
  } finally {
    unlisten?.();
  }
}

export function saveRuntimeDraft(
  request: RuntimeSaveRequest,
): Promise<RuntimeSaveResult> {
  return invoke<RuntimeSaveResult>("save_runtime_draft", { request });
}

export async function runPreflight(
  projectPath: string,
  onLog?: (event: ProcessLogEvent) => void,
): Promise<PreflightResult> {
  const unlisten = onLog
    ? await listen<ProcessLogEvent>("preflight_log", (event) => onLog(event.payload))
    : undefined;

  try {
    return await invoke<PreflightResult>("run_preflight", {
      request: { project_path: projectPath },
    });
  } finally {
    unlisten?.();
  }
}

export async function startKnotLoop(
  request: { project_path: string; cli: string; max_iterations: number },
  onLog?: (event: ProcessLogEvent) => void,
): Promise<LoopResult> {
  const unlisten = onLog
    ? await listen<ProcessLogEvent>("knot_loop_log", (event) => onLog(event.payload))
    : undefined;

  try {
    return await invoke<LoopResult>("start_knot_loop", { request });
  } finally {
    unlisten?.();
  }
}

export function stopKnotLoop(): Promise<boolean> {
  return invoke<boolean>("stop_knot_loop");
}

export function readArtifacts(projectPath: string): Promise<ArtifactsSnapshot> {
  return invoke<ArtifactsSnapshot>("read_artifacts", {
    request: { project_path: projectPath },
  });
}
