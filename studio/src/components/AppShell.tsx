import type { ReactNode } from "react";

export type SectionId =
  | "overview"
  | "brief"
  | "spec"
  | "workflow"
  | "taskboard"
  | "gates"
  | "validation"
  | "run"
  | "outputs"
  | "settings";

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "brief", label: "Project Brief" },
  { id: "spec", label: "Project Spec" },
  { id: "workflow", label: "Workflow Builder" },
  { id: "taskboard", label: "Taskboard" },
  { id: "gates", label: "Gate Rules" },
  { id: "validation", label: "Validation Center" },
  { id: "run", label: "Run Console" },
  { id: "outputs", label: "Outputs" },
  { id: "settings", label: "Settings" },
];

interface AppShellProps {
  activeSection: SectionId;
  knotRoot: string | null;
  status: string;
  onSectionChange: (section: SectionId) => void;
  children: ReactNode;
}

export function AppShell({
  activeSection,
  knotRoot,
  status,
  onSectionChange,
  children,
}: AppShellProps) {
  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Knot Studio</h1>
        <nav>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? "active" : ""}`}
              aria-current={activeSection === section.id ? "page" : undefined}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span>{knotRoot ?? "No project selected"}</span>
          <span className="status-pill">{status}</span>
        </header>
        {children}
      </section>
    </main>
  );
}
