import { useState } from "react";

import { saveProjectBrief } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface ProjectBriefProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectBrief({ snapshot, onSnapshotChange }: ProjectBriefProps) {
  const [draft, setDraft] = useState(snapshot.projectBrief);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      onSnapshotChange(await saveProjectBrief(snapshot.knotRoot, draft));
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
    </section>
  );
}
