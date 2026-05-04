import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

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

const sections: SectionId[] = [
  "overview",
  "brief",
  "spec",
  "workflow",
  "taskboard",
  "gates",
  "validation",
  "run",
  "outputs",
  "settings",
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
  const { t } = useTranslation();

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Knot Studio</h1>
        <nav>
          {sections.map((section) => (
            <button
              key={section}
              className={`nav-item ${activeSection === section ? "active" : ""}`}
              aria-current={activeSection === section ? "page" : undefined}
              onClick={() => onSectionChange(section)}
            >
              {t(`nav.${section}`)}
            </button>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span>{knotRoot ?? t("app.noProjectSelected")}</span>
          <span className="status-pill">{status}</span>
        </header>
        {children}
      </section>
    </main>
  );
}
