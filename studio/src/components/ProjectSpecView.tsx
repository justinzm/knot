import { useMemo, useState } from "react";

import { saveProjectSpec } from "../lib/knot/tauri";
import type { ProjectSpec, RuntimeSnapshot } from "../lib/knot/types";

interface ProjectSpecViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectSpecView({ snapshot, onSnapshotChange }: ProjectSpecViewProps) {
  const initialSpec = useMemo(() => parseSpec(snapshot.projectSpecJson), [snapshot.projectSpecJson]);
  const [draft, setDraft] = useState<ProjectSpec | null>(initialSpec.ok ? initialSpec.value : null);
  const [saving, setSaving] = useState(false);

  if (!initialSpec.ok) {
    return (
      <section className="panel">
        <h2>Project Spec</h2>
        <p className="error-text">{initialSpec.message}</p>
      </section>
    );
  }
  if (!draft) {
    return (
      <section className="panel">
        <h2>Project Spec</h2>
        <p className="error-text">Project spec draft is unavailable.</p>
      </section>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      onSnapshotChange(await saveProjectSpec(snapshot.knotRoot, JSON.stringify(draft, null, 2) + "\n"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Project Spec</h2>
      <div className="form-grid">
        <label className="field">
          <span>Project id</span>
          <input
            value={draft.project_id}
            onChange={(event) => setDraft({ ...draft, project_id: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Project type</span>
          <input
            value={draft.project_type}
            onChange={(event) => setDraft({ ...draft, project_type: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Target medium</span>
          <input
            value={draft.target_medium}
            onChange={(event) => setDraft({ ...draft, target_medium: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Language</span>
          <input
            value={draft.language}
            onChange={(event) => setDraft({ ...draft, language: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Audience</span>
          <input
            value={draft.audience}
            onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Stages, comma-separated</span>
          <input
            value={draft.workflow.stages.join(", ")}
            onChange={(event) =>
              setDraft({
                ...draft,
                workflow: {
                  ...draft.workflow,
                  stages: event.target.value
                    .split(",")
                    .map((stage) => stage.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
      </div>
      <button className="primary-button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save spec"}
      </button>
    </section>
  );
}

function parseSpec(json: string): { ok: true; value: ProjectSpec } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as ProjectSpec };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
