import type { WorkbenchStatus } from "../lib/tauri/commands";

interface OverviewViewProps {
  status: WorkbenchStatus | null;
  isBusy: boolean;
  error: string | null;
  onCheckRust: () => void;
}

export function OverviewView({
  status,
  isBusy,
  error,
  onCheckRust,
}: OverviewViewProps) {
  return (
    <section className="page-panel" aria-labelledby="page-title">
      <div className="page-header">
        <div>
          <p className="page-kicker">Knot Workbench</p>
          <h1 id="page-title" className="page-title">
            总览
          </h1>
          <p className="page-description">
            查看运行时就绪度、内容单元分布、预检状态和下一步动作。
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={onCheckRust}
          disabled={isBusy}
        >
          {isBusy ? "检查中" : "检查 Rust 通路"}
        </button>
      </div>

      <div className="placeholder-grid">
        <article className="placeholder-card">
          <h3>页面状态</h3>
          <p>准备项目、运行时和工作流编辑已经接入；后续阶段继续完善保存与预检。</p>
        </article>
        <article className="placeholder-card">
          <h3>Rust 通路</h3>
          <p>{status ? `${status.phase}：已连接` : "等待检查"}</p>
        </article>
        <article className="placeholder-card">
          <h3>下一步</h3>
          <p>进入“运行时”或“工作流”审查 AI 生成的运行时草案。</p>
        </article>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
    </section>
  );
}
