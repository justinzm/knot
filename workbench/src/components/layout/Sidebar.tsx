import { FolderOpen } from "lucide-react";
import { navigationItems, type NavId } from "../../lib/navigation";
import "./Sidebar.css";

interface SidebarProps {
  activeId: NavId;
  projectName?: string | null;
  onNavigate: (id: NavId) => void;
}

export function Sidebar({ activeId, projectName, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="侧边栏">
      <div className="sidebar-brand">
        <div className="knot-logo" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>Knot Workbench</strong>
          <small>本地运行时工作台</small>
        </div>
      </div>

      <nav className="nav-list" aria-label="主导航">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={item.id === activeId ? "is-active" : ""}
              onClick={() => onNavigate(item.id)}
            >
              <Icon aria-hidden="true" size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-project">
        <div>
          <span>当前项目</span>
          <strong>{projectName ?? "未选择"}</strong>
        </div>
        <button type="button" onClick={() => onNavigate("prepare")}>
          <FolderOpen aria-hidden="true" size={16} />
          切换项目
        </button>
      </div>
    </aside>
  );
}
