import { open } from "@tauri-apps/plugin-dialog";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { KnotDetectionPanel } from "../components/prepare/KnotDetectionPanel";
import { GenerationConsole } from "../components/prepare/GenerationConsole";
import { RuntimeProtectionDialog } from "../components/prepare/RuntimeProtectionDialog";
import { ScanSummary } from "../components/prepare/ScanSummary";
import type {
  AppSettings,
  CliStatus,
  GenerateRuntimeResult,
  ProjectSummary,
  ProjectScanSummary,
  RuntimeGenerationLogEvent,
  TemplateSummary,
} from "../lib/tauri/commands";
import "./PrepareProjectView.css";

interface PrepareProjectViewProps {
  settings: AppSettings;
  project: ProjectSummary | null;
  template: TemplateSummary | null;
  scan: ProjectScanSummary | null;
  generationResult: GenerateRuntimeResult | null;
  generationLogs: RuntimeGenerationLogEvent[];
  cliStatuses: CliStatus[];
  isBusy: boolean;
  error: string | null;
  notice: string | null;
  onChooseProject: (path: string) => void;
  onInstallTemplate: (options: { backup: boolean; allowProduction: boolean }) => void;
  onScanProject: () => void;
  onGenerateRuntime: () => void;
  onDetectCli: () => void;
  onSettingsChange: (settings: AppSettings) => void;
}

export function PrepareProjectView({
  settings,
  project,
  template,
  scan,
  generationResult,
  generationLogs,
  cliStatuses,
  isBusy,
  error,
  notice,
  onChooseProject,
  onInstallTemplate,
  onScanProject,
  onGenerateRuntime,
  onDetectCli,
  onSettingsChange,
}: PrepareProjectViewProps) {
  const [showProtection, setShowProtection] = useState(false);

  async function chooseFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择需要自动化的项目文件夹",
    });

    if (typeof selected === "string") {
      onChooseProject(selected);
    }
  }

  const availableCli = cliStatuses.filter((cli) => cli.available);
  const canGenerate = Boolean(project && availableCli.length > 0);

  return (
    <section className="prepare-view" aria-label="准备项目">
      <div className="prepare-hero">
        <div>
          <p className="page-kicker">准备项目</p>
          <h1 className="page-title">选择项目并检查运行环境</h1>
          <p className="page-description">
            选择一个普通项目文件夹后，工作台会检测 Knot 目录、运行时状态和本机
            AI CLI，并为后续生成运行时草案做好准备。
          </p>
        </div>
        <button type="button" className="primary-action" onClick={chooseFolder}>
          打开项目
        </button>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
      {notice ? <p className="notice-message">{notice}</p> : null}

      <div className="prepare-grid">
        <KnotDetectionPanel
          project={project}
          template={template}
          isBusy={isBusy}
          onInstall={() => onInstallTemplate({ backup: false, allowProduction: false })}
          onProductionAction={() => setShowProtection(true)}
        />

        <section className="prepare-panel">
          <div className="panel-heading">
            <h2>AI CLI</h2>
            <button type="button" onClick={onDetectCli} disabled={isBusy}>
              <RefreshCw aria-hidden="true" size={15} />
              重新检测
            </button>
          </div>
          <div className="cli-list">
            {cliStatuses.map((cli) => (
              <div key={cli.name} className={cli.available ? "is-available" : ""}>
                <strong>{cli.name}</strong>
                <span>{cli.available ? cli.version ?? "可用" : "未找到"}</span>
              </div>
            ))}
          </div>
          {!canGenerate ? <p className="warning-text">至少需要一个可用 AI CLI。</p> : null}
        </section>

        <section className="prepare-panel settings-panel">
          <h2>运行设置</h2>
          <label>
            默认 AI CLI
            <select
              value={settings.default_cli}
              onChange={(event) =>
                onSettingsChange({ ...settings, default_cli: event.currentTarget.value })
              }
            >
              <option value="claude">claude</option>
              <option value="amp">amp</option>
            </select>
          </label>
          <label>
            最大迭代次数
            <input
              min={1}
              max={50}
              type="number"
              value={settings.max_iterations}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  max_iterations: Number(event.currentTarget.value),
                })
              }
            />
          </label>
          <label>
            扫描排除
            <textarea
              rows={4}
              value={settings.scan_exclusions.join("\n")}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  scan_exclusions: event.currentTarget.value.split("\n"),
                })
              }
            />
          </label>
          <p>
            模板来源：
            {settings.template_source === "bundled" ? "内置模板" : settings.template_source}
          </p>
        </section>

        <section className="prepare-panel recent-panel">
          <h2>最近项目</h2>
          {settings.recent_projects.length === 0 ? (
            <p>暂无最近项目。</p>
          ) : (
            settings.recent_projects.map((recent) => (
              <button key={recent.path} type="button" onClick={() => onChooseProject(recent.path)}>
                <strong>{recent.name}</strong>
                <span>{recent.path}</span>
              </button>
            ))
          )}
        </section>

        <ScanSummary
          scan={scan}
          scanDisabled={!project || isBusy}
          generateDisabled={!canGenerate || !scan || isBusy}
          onScan={onScanProject}
          onGenerate={onGenerateRuntime}
        />

        <GenerationConsole result={generationResult} liveLogs={generationLogs} />
      </div>

      {project && showProtection ? (
        <RuntimeProtectionDialog
          project={project}
          isBusy={isBusy}
          onBackupReplace={() => {
            setShowProtection(false);
            onInstallTemplate({ backup: true, allowProduction: true });
          }}
          onRefreshInPlace={() => {
            setShowProtection(false);
            onInstallTemplate({ backup: false, allowProduction: true });
          }}
          onChooseAnother={() => setShowProtection(false)}
        />
      ) : null}
    </section>
  );
}
