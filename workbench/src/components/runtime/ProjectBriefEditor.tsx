interface ProjectBriefEditorProps {
  brief: string;
  readOnly: boolean;
  onChange: (brief: string) => void;
}

export function ProjectBriefEditor({
  brief,
  readOnly,
  onChange,
}: ProjectBriefEditorProps) {
  const lines = brief.split("\n").filter(Boolean).length;

  return (
    <section className="runtime-panel brief-editor">
      <div className="panel-heading">
        <h2>项目简报</h2>
        <span>{lines} 行</span>
      </div>
      <textarea
        value={brief}
        readOnly={readOnly}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <div className="brief-summary">
        <strong>结构摘要</strong>
        <p>建议包含目标、输入素材、输出产物、风格约束和审核要求。</p>
      </div>
    </section>
  );
}
