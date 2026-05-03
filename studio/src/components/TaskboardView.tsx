import { useEffect, useMemo, useState } from "react";

import { normalizeUnknownError } from "../lib/errors";
import { saveTaskboard } from "../lib/knot/tauri";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";

interface TaskboardViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function TaskboardView({ snapshot, onSnapshotChange }: TaskboardViewProps) {
  const [draft, setDraft] = useState(snapshot.taskboardJson);
  const parsed = useMemo(() => parseTaskboard(draft), [draft]);
  const issues = parsed.ok ? validateTaskboardBasics(parsed.value) : [];
  const hasBlockingIssue = issues.some((issue) => issue.severity === "error");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(snapshot.taskboardJson);
  }, [snapshot.knotRoot, snapshot.taskboardJson]);

  async function handleSave() {
    if (!parsed.ok || hasBlockingIssue) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSnapshotChange(await saveTaskboard(snapshot.knotRoot, JSON.stringify(parsed.value, null, 2) + "\n"));
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Taskboard</h2>
      <div className="split-panel">
        <label className="field wide">
          <span>Taskboard JSON</span>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={24} />
        </label>
        <aside className="validation-list">
          <h3>Validation</h3>
          {!parsed.ok ? <p className="error-text">{parsed.message}</p> : null}
          {parsed.ok && issues.length === 0 ? <p>No client-side issues.</p> : null}
          {issues.map((issue) => (
            <p
              key={`${issue.path}-${issue.message}`}
              className={issue.severity === "error" ? "error-text" : ""}
            >
              <strong>{issue.path}</strong>: {issue.message}
            </p>
          ))}
        </aside>
      </div>
      <button className="primary-button" onClick={handleSave} disabled={!parsed.ok || hasBlockingIssue || saving}>
        {saving ? "Saving..." : "Save taskboard"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
