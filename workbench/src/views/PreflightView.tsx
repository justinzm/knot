import { PreflightChecklist } from "../components/preflight/PreflightChecklist";
import { PreflightJsonPreview } from "../components/preflight/PreflightJsonPreview";
import { RunConsole } from "../components/run/RunConsole";
import type { KnotExecutionWorkspace } from "../hooks/useKnotExecution";
import "./ProcessView.css";

interface PreflightViewProps {
  projectPath: string | null;
  execution: KnotExecutionWorkspace;
  onOpenRuntime: () => void;
}

export function PreflightView({
  projectPath,
  execution,
  onOpenRuntime,
}: PreflightViewProps) {
  const failed = execution.preflightResult && !execution.preflightResult.ok;

  return (
    <section className="process-view" aria-label="预检">
      <div className="page-header">
        <div>
          <p className="page-kicker">预检</p>
          <h1 className="page-title">运行运行时预检</h1>
          <p className="page-description">
            执行 Knot 的 preflight 脚本并读取 latest.json，失败时展示文件和字段线索。
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          disabled={!projectPath || execution.isPreflightRunning}
          onClick={() => void execution.runProjectPreflight(projectPath)}
        >
          {execution.isPreflightRunning ? "预检中" : "运行预检"}
        </button>
      </div>

      {!projectPath ? <p className="error-message">请先在“准备项目”选择项目文件夹。</p> : null}
      {execution.executionError ? (
        <p className="error-message">{execution.executionError}</p>
      ) : null}
      {failed ? (
        <button type="button" className="secondary-action" onClick={onOpenRuntime}>
          打开运行时页面
        </button>
      ) : null}

      <div className="process-grid">
        <PreflightChecklist checks={execution.preflightResult?.checks ?? []} />
        <RunConsole
          title="预检日志"
          logs={execution.preflightLogs}
          fallback="等待运行预检"
        />
        <PreflightJsonPreview report={execution.preflightResult?.report ?? null} />
      </div>
    </section>
  );
}
