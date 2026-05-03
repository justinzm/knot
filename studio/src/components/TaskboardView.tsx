import { useEffect, useMemo, useState } from "react";

import { normalizeUnknownError } from "../lib/errors";
import { detectDependencyCycles } from "../lib/knot/graph";
import { saveTaskboard } from "../lib/knot/tauri";
import type { RuntimeSnapshot, Story, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";
import { StoryInspector } from "./StoryInspector";

interface TaskboardViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function TaskboardView({ snapshot, onSnapshotChange }: TaskboardViewProps) {
  const [draft, setDraft] = useState(() => parseTaskboard(snapshot.taskboardJson));
  const [selectedStoryId, setSelectedStoryId] = useState(() => (draft.ok ? draft.value.stories[0]?.id ?? null : null));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const issues = useMemo(() => (draft.ok ? validateTaskboardBasics(draft.value) : []), [draft]);
  const cycles = useMemo(() => (draft.ok ? detectDependencyCycles(draft.value) : []), [draft]);
  const selectedStory = draft.ok
    ? draft.value.stories.find((story) => story.id === selectedStoryId) ?? draft.value.stories[0] ?? null
    : null;
  const hasBlockingIssue = issues.some((issue) => issue.severity === "error") || cycles.length > 0;

  useEffect(() => {
    const parsed = parseTaskboard(snapshot.taskboardJson);
    setDraft(parsed);
    setSelectedStoryId(parsed.ok ? parsed.value.stories[0]?.id ?? null : null);
  }, [snapshot.knotRoot, snapshot.taskboardJson]);

  async function handleSave() {
    if (!draft.ok || hasBlockingIssue) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSnapshotChange(await saveTaskboard(snapshot.knotRoot, JSON.stringify(draft.value, null, 2) + "\n"));
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setSaving(false);
    }
  }

  function handleStoryChange(nextStory: Story) {
    if (!draft.ok) {
      return;
    }
    setDraft({
      ok: true,
      value: {
        ...draft.value,
        stories: draft.value.stories.map((story) => (story.id === nextStory.id ? nextStory : story)),
      },
    });
  }

  return (
    <section className="panel">
      <h2>Taskboard</h2>
      {!draft.ok ? (
        <p className="error-text">{draft.message}</p>
      ) : (
        <div className="split-panel">
          <div>
            {draft.value.stories.length === 0 ? (
              <p>No stories in taskboard.</p>
            ) : (
              <div className="table-list">
                {draft.value.stories.map((story, storyIndex) => (
                  <button
                    key={`${story.id}-${storyIndex}`}
                    className={`table-list-row ${story.id === selectedStory?.id ? "active" : ""}`}
                    onClick={() => setSelectedStoryId(story.id)}
                  >
                    <span>{story.id}</span>
                    <strong>{story.title}</strong>
                    <span>{story.status}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="validation-list">
              <h3>Validation</h3>
              {issues.length === 0 && cycles.length === 0 ? <p>No client-side issues.</p> : null}
              {issues.map((issue) => (
                <p
                  key={`${issue.path}-${issue.message}`}
                  className={issue.severity === "error" ? "error-text" : ""}
                >
                  <strong>{issue.path}</strong>: {issue.message}
                </p>
              ))}
              {cycles.map((cycle) => (
                <p key={cycle.join("-")} className="error-text">
                  <strong>dependency cycle</strong>: {cycle.join(" -> ")}
                </p>
              ))}
            </div>
          </div>
          {selectedStory ? <StoryInspector story={selectedStory} onChange={handleStoryChange} /> : null}
        </div>
      )}
      <button className="primary-button" onClick={handleSave} disabled={!draft.ok || hasBlockingIssue || saving}>
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
