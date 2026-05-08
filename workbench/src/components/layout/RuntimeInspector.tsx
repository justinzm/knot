import type { NavId } from "../../lib/navigation";
import type { RuntimeWorkspace } from "../../hooks/useRuntimeWorkspace";
import "./InspectorPanel.css";

interface RuntimeInspectorProps {
  activeId: NavId;
  workspace: RuntimeWorkspace;
}

export function RuntimeInspector({ activeId, workspace }: RuntimeInspectorProps) {
  const story = workspace.selectedStory;
  const title = activeId === "workflow" ? "内容单元检查器" : "运行时检查器";

  return (
    <aside className="inspector-panel" aria-label="右侧检查器">
      <p className="inspector-kicker">检查器</p>
      <h2>{title}</h2>
      <p>
        {workspace.isRuntimeRunning
          ? "运行中只读保护已启用。"
          : "当前修改仅保存在工作台内存中，保存后才会写入项目。"}
      </p>

      <section className="inspector-section">
        <h3>当前选择</h3>
        <span>{story ? `${story.id} · ${story.title}` : "暂无内容单元"}</span>
      </section>

      <section className="inspector-section">
        <h3>结构摘要</h3>
        <span>{workspace.taskboard.stories.length} 个内容单元</span>
        <span>{workspace.spec.workflow.stages.join(" / ")}</span>
      </section>

      {workspace.runtimeMessage ? (
        <section className="inspector-section">
          <h3>校验摘要</h3>
          <span>{workspace.runtimeMessage}</span>
        </section>
      ) : null}
    </aside>
  );
}
