interface PreflightJsonPreviewProps {
  report: unknown | null;
}

export function PreflightJsonPreview({ report }: PreflightJsonPreviewProps) {
  return (
    <section className="process-panel json-preview">
      <div className="panel-heading">
        <h2>预检报告</h2>
        <span>{report ? "已读取" : "等待生成"}</span>
      </div>
      <pre>{report ? JSON.stringify(report, null, 2) : "暂无预检报告"}</pre>
    </section>
  );
}
