import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface GateRulesProps {
  snapshot: RuntimeSnapshot;
}

export function GateRules({ snapshot }: GateRulesProps) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>{t("gates.title")}</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{t("gates.title")}</h2>
      {parsed.value.stories.length === 0 ? <p>{t("gates.noStories")}</p> : null}
      <div className="table-list">
        {parsed.value.stories.map((story, index) => (
          <article className="table-row" key={`${story.id}-${index}`}>
            <div>
              <strong>{story.id}</strong>
              <p>{story.title}</p>
            </div>
            <div>{story.review_policy.required_gates.join(", ")}</div>
            <div>{story.review_policy.blocking === false ? t("gates.nonBlocking") : t("gates.blocking")}</div>
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
