import type { LoopResult, PreflightResult } from "../../lib/tauri/commands";

interface RunSummaryProps {
  preflight: PreflightResult | null;
  loop: LoopResult | null;
}

function loopStatusLabel(status: LoopResult["status"] | undefined): string {
  switch (status) {
    case "completed":
      return "已完成";
    case "failed":
      return "失败";
    case "stopped":
      return "已停止";
    default:
      return "未运行";
  }
}

export function RunSummary({ preflight, loop }: RunSummaryProps) {
  return (
    <section className="process-panel run-summary">
      <div className="panel-heading">
        <h2>运行摘要</h2>
        <span>{loopStatusLabel(loop?.status)}</span>
      </div>
      <div className="summary-grid">
        <span>预检：{preflight?.ok ? "通过" : "未通过"}</span>
        <span>退出码：{loop?.exit_code ?? "-"}</span>
        <span>完成信号：{loop?.completed ? "已出现" : "未出现"}</span>
        <span>内容单元数量：{loop?.project.story_count ?? "-"}</span>
        <span>进度记录：{loop?.project.progress_entries ?? "-"}</span>
        <span>审核文件：{loop?.project.review_count ?? "-"}</span>
      </div>
    </section>
  );
}
