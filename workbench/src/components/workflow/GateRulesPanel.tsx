import { GATE_OPTIONS } from "../../lib/knot/types";
import { splitLines, toggleGate } from "../../lib/knot/taskboard";
import type { Story } from "../../lib/knot/types";

interface GateRulesPanelProps {
  story: Story | null;
  readOnly: boolean;
  onChange: (story: Story) => void;
}

export function GateRulesPanel({ story, readOnly, onChange }: GateRulesPanelProps) {
  if (!story) {
    return null;
  }

  return (
    <section className="workflow-panel gate-rules">
      <div className="panel-heading">
        <h2>门禁规则</h2>
        <span>{story.review_policy.blocking === false ? "非阻塞" : "阻塞"}</span>
      </div>
      <div className="gate-chip-row">
        {GATE_OPTIONS.map((gate) => (
          <label key={gate}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={story.review_policy.required_gates.includes(gate)}
              onChange={() =>
                onChange({
                  ...story,
                  review_policy: {
                    ...story.review_policy,
                    required_gates: toggleGate(story.review_policy.required_gates, gate),
                  },
                })
              }
            />
            {gate}
          </label>
        ))}
      </div>
      <label>
        审核人
        <textarea
          rows={2}
          disabled={readOnly}
          value={(story.review_policy.reviewers ?? []).join("\n")}
          onChange={(event) =>
            onChange({
              ...story,
              review_policy: {
                ...story.review_policy,
                reviewers: splitLines(event.currentTarget.value),
              },
            })
          }
        />
      </label>
      <label>
        审核产物路径
        <textarea
          rows={3}
          disabled={readOnly}
          value={(story.review_policy.review_artifacts ?? []).join("\n")}
          onChange={(event) =>
            onChange({
              ...story,
              review_policy: {
                ...story.review_policy,
                review_artifacts: splitLines(event.currentTarget.value),
              },
            })
          }
        />
      </label>
    </section>
  );
}
