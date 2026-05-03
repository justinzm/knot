import { useState } from "react";

import { AppShell, type SectionId } from "./components/AppShell";
import { Settings } from "./components/Settings";
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
      {activeSection === "settings" ? (
        <Settings onRuntimeLoaded={handleRuntimeLoaded} />
      ) : (
        <section className="panel">
          <h2>{activeSection}</h2>
          <p>{snapshot ? "Runtime is loaded." : "Open a runtime from Settings."}</p>
        </section>
      )}
    </AppShell>
  );
}
