import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { RuntimeInspector } from "./components/layout/RuntimeInspector";
import type { ThemeMode } from "./components/layout/TopStatusBar";
import { useKnotExecution } from "./hooks/useKnotExecution";
import { useRuntimeWorkspace } from "./hooks/useRuntimeWorkspace";
import type { NavId } from "./lib/navigation";
import { defaultSettings, normalizeSettings } from "./lib/settings";
import {
  detectAiClis,
  generateRuntimeDraft,
  getTemplateSummary,
  getSettings,
  getWorkbenchStatus,
  installKnotTemplate,
  inspectProject,
  rememberProject,
  saveSettings,
  scanProject,
  type AppSettings,
  type CliStatus,
  type GenerateRuntimeResult,
  type ProjectSummary,
  type ProjectScanSummary,
  type RuntimeGenerationLogEvent,
  type TemplateSummary,
  type WorkbenchStatus,
} from "./lib/tauri/commands";
import { PrepareProjectView } from "./views/PrepareProjectView";
import { WorkbenchMainView } from "./views/WorkbenchMainView";

function App() {
  const [activeId, setActiveId] = useState<NavId>("overview");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [template, setTemplate] = useState<TemplateSummary | null>(null);
  const [scan, setScan] = useState<ProjectScanSummary | null>(null);
  const [generationResult, setGenerationResult] =
    useState<GenerateRuntimeResult | null>(null);
  const [generationLogs, setGenerationLogs] = useState<RuntimeGenerationLogEvent[]>([]);
  const [cliStatuses, setCliStatuses] = useState<CliStatus[]>([]);
  const [status, setStatus] = useState<WorkbenchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const runtimeWorkspace = useRuntimeWorkspace();
  const executionWorkspace = useKnotExecution();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void hydrateInitialState();
  }, []);

  async function hydrateInitialState() {
    try {
      const loadedSettings = normalizeSettings(await getSettings());
      setSettings(loadedSettings);
      setTheme(loadedSettings.theme);
      setTemplate(await getTemplateSummary());
      setCliStatuses(await detectAiClis());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "读取本地设置失败");
    }
  }

  async function checkRustBridge() {
    setIsBusy(true);
    setError(null);
    setActionMessage(null);

    try {
      setStatus(await getWorkbenchStatus());
    } catch (err: unknown) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Rust 通路检查失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleInstallTemplate(options: {
    backup: boolean;
    allowProduction: boolean;
  }) {
    if (!project) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setActionMessage(null);

    try {
      const result = await installKnotTemplate({
        project_path: project.path,
        backup_existing_runtime: options.backup,
        allow_production: options.allowProduction,
      });
      setProject(result.project);
      setScan(null);
      setGenerationResult(null);
      setGenerationLogs([]);
      setActionMessage(
        result.backup
          ? `已备份 ${result.backup.copied_files} 个文件，并复制 ${result.copied_files} 个模板文件。`
          : `已复制 ${result.copied_files} 个模板文件。`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "复制 Knot 模板失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleChooseProject(path: string) {
    setIsBusy(true);
    setError(null);

    try {
      const summary = await inspectProject(path);
      setProject(summary);
      setScan(null);
      setGenerationResult(null);
      setGenerationLogs([]);
      setSettings(normalizeSettings(await rememberProject(path)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "项目检测失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleScanProject() {
    if (!project) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setActionMessage(null);

    try {
      setScan(
        await scanProject({
          project_path: project.path,
          exclusions: settings.scan_exclusions,
        }),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成扫描摘要失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGenerateRuntime() {
    if (!project) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setActionMessage(null);
    setGenerationResult(null);
    setGenerationLogs([]);

    try {
      const result = await generateRuntimeDraft(
        {
          project_path: project.path,
          cli: settings.default_cli,
          exclusions: settings.scan_exclusions,
        },
        (event) => setGenerationLogs((logs) => [...logs, event]),
      );
      setGenerationResult(result);
      setActionMessage(
        result.staging_dir
          ? "运行时草案已写入暂存区，等待审查。"
          : "AI CLI 未成功生成暂存区文件，请查看生成日志。",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成运行时草案失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDetectCli() {
    setIsBusy(true);
    setError(null);

    try {
      setCliStatuses(await detectAiClis());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI CLI 检测失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSettingsChange(nextSettings: AppSettings) {
    const normalized = normalizeSettings(nextSettings);
    setSettings(normalized);
    setTheme(normalized.theme);

    try {
      setSettings(normalizeSettings(await saveSettings(normalized)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存本地设置失败");
    }
  }

  async function handleThemeChange(nextTheme: ThemeMode) {
    await handleSettingsChange({ ...settings, theme: nextTheme });
  }

  function renderActiveView() {
    if (activeId === "prepare") {
      return (
        <PrepareProjectView
          settings={settings}
          project={project}
          template={template}
          scan={scan}
          generationResult={generationResult}
          generationLogs={generationLogs}
          cliStatuses={cliStatuses}
          isBusy={isBusy}
          error={error}
          notice={actionMessage}
          onChooseProject={handleChooseProject}
          onInstallTemplate={(options) => void handleInstallTemplate(options)}
          onScanProject={() => void handleScanProject()}
          onGenerateRuntime={() => void handleGenerateRuntime()}
          onDetectCli={handleDetectCli}
          onSettingsChange={(nextSettings) => void handleSettingsChange(nextSettings)}
        />
      );
    }

    return (
      <WorkbenchMainView
        activeId={activeId}
        projectPath={project?.path ?? null}
        settings={settings}
        status={status}
        isBusy={isBusy}
        error={error}
        runtime={runtimeWorkspace}
        execution={executionWorkspace}
        onCheckRust={checkRustBridge}
        onNavigate={setActiveId}
      />
    );
  }

  return (
    <AppShell
      activeId={activeId}
      projectName={project?.name ?? null}
      theme={theme}
      inspector={
        activeId === "runtime" || activeId === "workflow" ? (
          <RuntimeInspector activeId={activeId} workspace={runtimeWorkspace} />
        ) : undefined
      }
      onNavigate={setActiveId}
      onThemeChange={(nextTheme) => void handleThemeChange(nextTheme)}
    >
      {renderActiveView()}
    </AppShell>
  );
}

export default App;
