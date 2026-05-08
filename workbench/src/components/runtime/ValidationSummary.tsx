import type { RuntimeSaveResult, RuntimeValidationIssue } from "../../lib/tauri/commands";

interface ValidationSummaryProps {
  issues: RuntimeValidationIssue[];
  result: RuntimeSaveResult | null;
  isSaving: boolean;
}

export function ValidationSummary({
  issues,
  result,
  isSaving,
}: ValidationSummaryProps) {
  if (isSaving) {
    return <p className="notice-message">正在校验并保存 runtime...</p>;
  }

  if (issues.length > 0) {
    return (
      <section className="validation-summary" aria-label="校验摘要">
        <h2>校验失败</h2>
        <ul>
          {issues.map((issue) => (
            <li key={`${issue.file}-${issue.field}-${issue.story_id ?? "global"}-${issue.message}`}>
              <strong>{issue.file}</strong>
              <span>{issue.story_id ? `${issue.story_id} · ` : ""}{issue.field}</span>
              <p>{issue.message}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (result?.ok) {
    return (
      <section className="validation-summary is-ok" aria-label="保存摘要">
        <h2>保存完成</h2>
        <p>已写入 {result.written_files.length} 个 runtime 文件。</p>
        {result.snapshot_dir ? <p>快照：{result.snapshot_dir}</p> : null}
      </section>
    );
  }

  return null;
}
