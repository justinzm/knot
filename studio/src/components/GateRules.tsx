import { useMemo } from "react";

import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface GateRulesProps {
  snapshot: RuntimeSnapshot;
}

export function GateRules({ snapshot }: GateRulesProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Gate Rules</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Gate Rules</h2>
      <div className="table-list">
        {parsed.value.stories.map((story) => (
          <article className="table-row" key={story.id}>
            <div>
              <strong>{story.id}</strong>
              <p>{story.title}</p>
            </div>
            <div>{story.review_policy.required_gates.join(", ")}</div>
            <div>{story.review_policy.blocking === false ? "non-blocking" : "blocking"}</div>
          </article>
        ))}
      </div>
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
