import { useMemo } from "react";

import { detectDependencyCycles, taskboardToGraph } from "../lib/knot/graph";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";

interface ValidationCenterProps {
  snapshot: RuntimeSnapshot;
}

export function ValidationCenter({ snapshot }: ValidationCenterProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);

  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Validation Center</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  const issues = validateTaskboardBasics(parsed.value);
  const cycles = detectDependencyCycles(parsed.value);
  const missingDependencies = taskboardToGraph(parsed.value).missingDependencies;

  return (
    <section className="panel">
      <h2>Validation Center</h2>
      {issues.length === 0 && cycles.length === 0 && missingDependencies.length === 0 ? (
        <p>No client-side validation issues.</p>
      ) : null}
      {issues.map((issue) => (
        <p key={`${issue.path}-${issue.message}`} className={issue.severity === "error" ? "error-text" : ""}>
          <strong>{issue.path}</strong>: {issue.message}
        </p>
      ))}
      {cycles.map((cycle) => (
        <p key={cycle.join("-")} className="error-text">
          <strong>dependency cycle</strong>: {cycle.join(" -> ")}
        </p>
      ))}
      {missingDependencies.map((dependency) => (
        <p key={`${dependency.from}-${dependency.to}`} className="error-text">
          <strong>missing dependency</strong>: {`${dependency.from} -> ${dependency.to}`}
        </p>
      ))}
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
