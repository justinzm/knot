import { useState } from "react";

import { AppShell, type SectionId } from "./components/AppShell";
import { ProjectBrief } from "./components/ProjectBrief";
import { ProjectSpecView } from "./components/ProjectSpecView";
import { Settings } from "./components/Settings";
import { TaskboardView } from "./components/TaskboardView";
import { ValidationCenter } from "./components/ValidationCenter";
import type { RuntimeSnapshot } from "./lib/knot/types";

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("settings");
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);

  function handleRuntimeLoaded(nextSnapshot: RuntimeSnapshot) {
    setSnapshot(nextSnapshot);
    setActiveSection("overview");
  }

  return (
    <AppShell
      activeSection={activeSection}
      knotRoot={snapshot?.knotRoot ?? null}
      status={snapshot ? "runtime loaded" : "idle"}
      onSectionChange={setActiveSection}
    >
      {renderSection(activeSection, snapshot, handleRuntimeLoaded, setSnapshot)}
    </AppShell>
  );
}

function renderSection(
  activeSection: SectionId,
  snapshot: RuntimeSnapshot | null,
  onRuntimeLoaded: (snapshot: RuntimeSnapshot) => void,
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void,
) {
  if (activeSection === "settings") {
    return <Settings onRuntimeLoaded={onRuntimeLoaded} />;
  }
  if (!snapshot) {
    return (
      <section className="panel">
        <h2>{activeSection}</h2>
        <p>Open a runtime from Settings.</p>
      </section>
    );
  }
  if (activeSection === "brief") {
    return <ProjectBrief snapshot={snapshot} onSnapshotChange={onSnapshotChange} />;
  }
  if (activeSection === "spec") {
    return <ProjectSpecView snapshot={snapshot} onSnapshotChange={onSnapshotChange} />;
  }
  if (activeSection === "taskboard") {
    return <TaskboardView snapshot={snapshot} onSnapshotChange={onSnapshotChange} />;
  }
  if (activeSection === "overview" || activeSection === "validation") {
    return <ValidationCenter snapshot={snapshot} />;
  }
  return (
    <section className="panel">
      <h2>{activeSection}</h2>
      <p>Runtime is loaded.</p>
    </section>
  );
}
