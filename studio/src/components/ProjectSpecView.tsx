import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeUnknownError } from "../lib/errors";
import { saveProjectSpec } from "../lib/knot/tauri";
import type { ProjectSpec, RuntimeSnapshot } from "../lib/knot/types";

interface ProjectSpecViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectSpecView({ snapshot, onSnapshotChange }: ProjectSpecViewProps) {
  const { t } = useTranslation();
  const initialSpec = useMemo(() => parseSpec(snapshot.projectSpecJson), [snapshot.projectSpecJson]);
  const [draft, setDraft] = useState<ProjectSpec | null>(initialSpec.ok ? initialSpec.value : null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initialSpec.ok ? initialSpec.value : null);
  }, [snapshot.knotRoot, initialSpec]);

  if (!initialSpec.ok) {
    return (
      <section className="panel">
        <h2>{t("spec.title")}</h2>
        <p className="error-text">{initialSpec.message}</p>
      </section>
    );
  }
  if (!draft) {
    return (
      <section className="panel">
        <h2>{t("spec.title")}</h2>
        <p className="error-text">{t("spec.unavailable")}</p>
      </section>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      onSnapshotChange(await saveProjectSpec(snapshot.knotRoot, JSON.stringify(draft, null, 2) + "\n"));
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t("spec.title")}</h2>
      <div className="form-grid">
        <label className="field">
          <span>{t("spec.projectId")}</span>
          <input
            value={draft.project_id}
            onChange={(event) => setDraft({ ...draft, project_id: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("spec.projectType")}</span>
          <input
            value={draft.project_type}
            onChange={(event) => setDraft({ ...draft, project_type: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("spec.targetMedium")}</span>
          <input
            value={draft.target_medium}
            onChange={(event) => setDraft({ ...draft, target_medium: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("spec.language")}</span>
          <input
            value={draft.language}
            onChange={(event) => setDraft({ ...draft, language: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("spec.audience")}</span>
          <input
            value={draft.audience}
            onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("spec.stages")}</span>
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
        {saving ? t("spec.saving") : t("spec.save")}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
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
