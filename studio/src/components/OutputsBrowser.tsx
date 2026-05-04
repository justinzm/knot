import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeUnknownError } from "../lib/errors";
import { listArtifacts } from "../lib/knot/tauri";
import type { ArtifactEntry, RuntimeSnapshot } from "../lib/knot/types";

interface OutputsBrowserProps {
  snapshot: RuntimeSnapshot;
}

export function OutputsBrowser({ snapshot }: OutputsBrowserProps) {
  const { t } = useTranslation();
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshArtifacts();
  }, [snapshot.knotRoot]);

  const selectedArtifact = artifacts.find((artifact) => artifact.path === selectedPath) ?? null;

  async function refreshArtifacts() {
    setLoading(true);
    setError(null);
    try {
      const nextArtifacts = await listArtifacts(snapshot.knotRoot);
      setArtifacts(nextArtifacts);
      setSelectedPath((currentPath) =>
        currentPath && nextArtifacts.some((artifact) => artifact.path === currentPath)
          ? currentPath
          : null,
      );
    } catch (caught) {
      setArtifacts([]);
      setSelectedPath(null);
      setError(normalizeUnknownError(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>{t("outputs.title")}</h2>
          <p>{t("outputs.description")}</p>
        </div>
        <button className="primary-button" onClick={refreshArtifacts} disabled={loading}>
          {loading ? t("outputs.refreshing") : t("outputs.refresh")}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="artifact-browser">
        <div className="artifact-list" aria-label={t("outputs.artifacts")}>
          {artifacts.length === 0 ? (
            <p>{t("outputs.none")}</p>
          ) : (
            artifacts.map((artifact) => (
              <button
                key={`${artifact.kind}:${artifact.path}`}
                className={`artifact-item ${selectedPath === artifact.path ? "active" : ""}`}
                onClick={() => setSelectedPath(artifact.path)}
                disabled={loading}
              >
                <span>{artifact.kind}</span>
                <strong>{artifact.path}</strong>
                {!artifact.exists ? <em>{t("outputs.missing")}</em> : null}
              </button>
            ))
          )}
        </div>
        <div className="artifact-preview">
          {selectedArtifact ? (
            <>
              <div>
                <span>{selectedArtifact.kind}</span>
                <h3>{selectedArtifact.path}</h3>
              </div>
              <pre>{selectedArtifact.contents || t("outputs.empty")}</pre>
            </>
          ) : (
            <p>{t("outputs.select")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
