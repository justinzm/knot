import type { ProjectSummary, TemplateSummary } from "../../lib/tauri/commands";
import { runtimeKindLabel, runtimeKindTone } from "../../lib/knot/status";
import "./KnotDetectionPanel.css";

interface KnotDetectionPanelProps {
  project: ProjectSummary | null;
  template: TemplateSummary | null;
  isBusy: boolean;
  onInstall: () => void;
  onProductionAction: () => void;
}

export function KnotDetectionPanel({
  project,
  template,
  isBusy,
  onInstall,
  onProductionAction,
}: KnotDetectionPanelProps) {
  if (!project) {
    return (
      <section className="prepare-panel">
        <h2>项目检测</h2>
        <p>尚未选择项目。</p>
      </section>
    );
  }

  const isProduction = project.runtime_kind === "production";
  const actionLabel = project.has_knot_dir ? "刷新 Knot 模板" : "复制 Knot 框架";

  return (
    <section className="prepare-panel">
      <div className="panel-heading">
        <h2>项目检测</h2>
        {isProduction ? (
          <button type="button" onClick={onProductionAction}>
            处理已有运行时
          </button>
        ) : (
          <button type="button" onClick={onInstall} disabled={isBusy}>
            {isBusy ? "处理中" : actionLabel}
          </button>
        )}
      </div>
      <div className="project-summary-card">
        <strong>{project.name}</strong>
        <span className="project-path">{project.path}</span>
        <SummaryRow label="Knot" value={project.has_knot_dir ? "已存在" : "缺失"} />
        <SummaryRow
          label="核心 / 自动化"
          value={project.has_core && project.has_automation ? "完整" : "未完整"}
        />
        <SummaryRow
          label="运行时"
          value={runtimeKindLabel(project.runtime_kind)}
          tone={runtimeKindTone(project.runtime_kind)}
        />
        <SummaryRow label="内容单元" value={String(project.story_count)} />
        <SummaryRow label="审核" value={String(project.review_count)} />
        {project.project_id ? (
          <SummaryRow label="项目 ID" value={project.project_id} />
        ) : null}
      </div>
      {template ? (
        <p className="template-summary">
          模板：core {template.has_core ? "可用" : "缺失"}，automation{" "}
          {template.has_automation ? "可用" : "缺失"}，运行时文件{" "}
          {template.runtime_files.length} 个。
        </p>
      ) : null}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "muted" | "ok" | "warn";
}) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <b data-tone={tone}>{value}</b>
    </div>
  );
}
