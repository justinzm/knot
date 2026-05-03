import { useState } from "react";

import { openRuntime } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface SettingsProps {
  onRuntimeLoaded: (snapshot: RuntimeSnapshot) => void;
}

function normalizeUnknownError(caught: unknown): string {
  if (caught instanceof Error) {
    return caught.message;
  }
  if (typeof caught === "string") {
    return caught;
  }
  if (
    caught &&
    typeof caught === "object" &&
    "message" in caught &&
    typeof caught.message === "string"
  ) {
    return caught.message;
  }

  try {
    return JSON.stringify(caught) ?? String(caught);
  } catch {
    return String(caught);
  }
}

export function Settings({ onRuntimeLoaded }: SettingsProps) {
  const [projectRoot, setProjectRoot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenRuntime() {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await openRuntime(projectRoot);
      onRuntimeLoaded(snapshot);
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Open Local Knot Project</h2>
      <label className="field">
        <span>Project folder path</span>
        <input
          value={projectRoot}
          onChange={(event) => setProjectRoot(event.target.value)}
          placeholder="/Users/example/my-content-project"
        />
      </label>
      <button className="primary-button" disabled={!projectRoot || loading} onClick={handleOpenRuntime}>
        {loading ? "Opening..." : "Open runtime"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
