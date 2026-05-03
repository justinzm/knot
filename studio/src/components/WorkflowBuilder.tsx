import { useMemo } from "react";

import { detectDependencyCycles, taskboardToGraph } from "../lib/knot/graph";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface WorkflowBuilderProps {
  snapshot: RuntimeSnapshot;
}

export function WorkflowBuilder({ snapshot }: WorkflowBuilderProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Workflow Builder</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  const graph = taskboardToGraph(parsed.value);
  const cycles = detectDependencyCycles(parsed.value);
  const stages = Array.from(new Set(parsed.value.stories.map((story) => story.stage)));

  return (
    <section className="panel">
      <h2>Workflow Builder</h2>
      {cycles.length > 0 ? (
        <div className="banner error-text">Dependency cycle: {cycles[0].join(" -> ")}</div>
      ) : null}
      {graph.missingDependencies.length > 0 ? (
        <div className="banner error-text">
          <strong>Missing Dependencies</strong>
          <ul>
            {graph.missingDependencies.map((edge) => (
              <li key={`${edge.from}-${edge.to}`}>
                {edge.from} {"->"} {edge.to}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="stage-board">
        {stages.map((stage) => (
          <div className="stage-column" key={stage}>
            <h3>{stage}</h3>
            {graph.nodes
              .filter((node) => node.stage === stage)
              .map((node) => (
                <article className="story-card" key={node.id}>
                  <strong>{node.id}</strong>
                  <span>{node.label}</span>
                  <small>{node.status}</small>
                </article>
              ))}
          </div>
        ))}
      </div>
      <h3>Dependencies</h3>
      <ul>
        {graph.edges.map((edge) => (
          <li key={`${edge.from}-${edge.to}`}>
            {edge.from} {"->"} {edge.to}
          </li>
        ))}
      </ul>
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
