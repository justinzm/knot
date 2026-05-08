import { RunConsole } from "../components/run/RunConsole";
import { RunSummary } from "../components/run/RunSummary";
import type { KnotExecutionWorkspace } from "../hooks/useKnotExecution";
import { preflightPassed } from "../lib/knot/runState";
import type { AppSettings } from "../lib/tauri/commands";
import "./ProcessView.css";

interface RunViewProps {
  projectPath: string | null;
  settings: AppSettings;
  execution: KnotExecutionWorkspace;
}

export function RunView({ projectPath, settings, execution }: RunViewProps) {
  const canRun = Boolean(projectPath && preflightPassed(execution.preflightResult));

  return (
    <section className="process-view" aria-label="运行">
      <div className="page-header">
        <div>
          <p className="page-kicker">运行</p>
          <h1 className="page-title">手动启动 Knot 循环</h1>
          <p className="page-description">
            预检通过后才能启动。运行中日志持续追加，停止按钮会终止当前 loop 进程。
          </p>
        </div>
        <div className="run-actions">
          <button
            type="button"
            className="primary-action"
            disabled={!canRun || execution.isLoopRunning}
            onClick={() =>
              void execution.startProjectLoop(
                projectPath,
                settings.default_cli,
                settings.max_iterations,
              )
            }
          >
            {execution.isLoopRunning ? "运行中" : "开始运行"}
          </button>
          <button
            type="button"
            className="secondary-action"
            disabled={!execution.isLoopRunning}
            onClick={() => void execution.stopProjectLoop()}
          >
            停止
          </button>
        </div>
      </div>

      {!projectPath ? <p className="error-message">请先在“准备项目”选择项目文件夹。</p> : null}
      {projectPath && !canRun ? (
        <p className="error-message">预检通过前不能开始运行。</p>
      ) : null}
      {execution.executionError ? (
        <p className="error-message">{execution.executionError}</p>
      ) : null}

      <div className="process-grid">
        <RunSummary preflight={execution.preflightResult} loop={execution.loopResult} />
        <RunConsole
          title="Knot 循环日志"
          logs={execution.loopLogs}
          fallback="等待开始运行"
        />
      </div>
    </section>
  );
}
