import type { ReactNode } from "react";
import { findNavigationItem, type NavId } from "../../lib/navigation";
import { InspectorPanel } from "./InspectorPanel";
import { Sidebar } from "./Sidebar";
import { TopStatusBar, type ThemeMode } from "./TopStatusBar";

interface AppShellProps {
  activeId: NavId;
  projectName?: string | null;
  theme: ThemeMode;
  children: ReactNode;
  inspector?: ReactNode;
  onNavigate: (id: NavId) => void;
  onThemeChange: (theme: ThemeMode) => void;
}

export function AppShell({
  activeId,
  projectName,
  theme,
  children,
  inspector,
  onNavigate,
  onThemeChange,
}: AppShellProps) {
  const activeItem = findNavigationItem(activeId);

  return (
    <div className="workbench-shell">
      <Sidebar activeId={activeId} projectName={projectName} onNavigate={onNavigate} />
      <div className="main-column">
        <TopStatusBar theme={theme} onThemeChange={onThemeChange} />
        <main className="content-region">{children}</main>
      </div>
      {inspector ?? <InspectorPanel item={activeItem} />}
    </div>
  );
}
