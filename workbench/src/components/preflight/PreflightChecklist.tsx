import type { PreflightCheck } from "../../lib/tauri/commands";

interface PreflightChecklistProps {
  checks: PreflightCheck[];
}

export function PreflightChecklist({ checks }: PreflightChecklistProps) {
  return (
    <section className="process-panel">
      <div className="panel-heading">
        <h2>检查清单</h2>
        <span>{checks.length} 项</span>
      </div>
      {checks.length === 0 ? (
        <p>运行预检后会显示 taskboard 和 project spec 校验结果。</p>
      ) : (
        <ul className="check-list">
          {checks.map((check) => (
            <li key={`${check.name}-${check.input}`} data-status={check.status}>
              <strong>{check.name}</strong>
              <span>{check.status}</span>
              <small>{check.input}</small>
              <p>{check.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
