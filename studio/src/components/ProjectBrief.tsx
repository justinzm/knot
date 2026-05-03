import { useEffect, useState } from "react";

import { normalizeUnknownError } from "../lib/errors";
import { saveProjectBrief } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface ProjectBriefProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectBrief({ snapshot, onSnapshotChange }: ProjectBriefProps) {
  const [draft, setDraft] = useState(snapshot.projectBrief);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(snapshot.projectBrief);
  }, [snapshot.knotRoot, snapshot.projectBrief]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      onSnapshotChange(await saveProjectBrief(snapshot.knotRoot, draft));
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Project Brief</h2>
      <label className="field wide">
        <span>Brief markdown</span>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={18} />
      </label>
      <button className="primary-button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save brief"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
