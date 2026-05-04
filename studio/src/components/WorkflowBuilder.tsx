import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { detectDependencyCycles, taskboardToGraph } from "../lib/knot/graph";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface WorkflowBuilderProps {
  snapshot: RuntimeSnapshot;
}

export function WorkflowBuilder({ snapshot }: WorkflowBuilderProps) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>{t("workflow.title")}</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  const graph = taskboardToGraph(parsed.value);
  const cycles = detectDependencyCycles(parsed.value);
  const stages = Array.from(new Set(parsed.value.stories.map((story) => story.stage)));

  return (
    <section className="panel">
      <h2>{t("workflow.title")}</h2>
      {parsed.value.stories.length === 0 ? <p>{t("workflow.noStories")}</p> : null}
      {cycles.length > 0 ? (
        <div className="banner error-text">
          {t("workflow.dependencyCycle")}: {cycles[0].join(" -> ")}
        </div>
      ) : null}
      {graph.missingDependencies.length > 0 ? (
        <div className="banner error-text">
          <strong>{t("workflow.missingDependencies")}</strong>
          <ul>
            {graph.missingDependencies.map((edge, index) => (
              <li key={`${edge.from}-${edge.to}-${index}`}>
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
              .map((node, index) => (
                <article className="story-card" key={`${node.id}-${index}`}>
                  <strong>{node.id}</strong>
                  <span>{node.label}</span>
                  <small>{node.status}</small>
                </article>
              ))}
          </div>
        ))}
      </div>
      <h3>{t("workflow.dependencies")}</h3>
      <ul>
        {graph.edges.map((edge, index) => (
          <li key={`${edge.from}-${edge.to}-${index}`}>
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
