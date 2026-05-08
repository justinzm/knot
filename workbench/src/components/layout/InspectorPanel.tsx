import type { NavigationItem } from "../../lib/navigation";
import "./InspectorPanel.css";

interface InspectorPanelProps {
  item: NavigationItem;
}

export function InspectorPanel({ item }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel" aria-label="右侧检查器">
      <p className="inspector-kicker">检查器</p>
      <h2>{item.inspectorTitle}</h2>
      <p>{item.inspectorSummary}</p>

      <section className="inspector-section">
        <h3>当前选择</h3>
        <span>暂无对象</span>
      </section>

      <section className="inspector-section">
        <h3>校验摘要</h3>
        <span>等待加载项目</span>
      </section>
    </aside>
  );
}
