import type { GateName, Story } from "../lib/knot/types";

const gateOptions: GateName[] = [
  "existence",
  "structure",
  "business",
  "compliance",
  "continuity",
  "editorial",
  "brand",
  "custom",
];

interface StoryInspectorProps {
  story: Story;
  onChange: (story: Story) => void;
}

export function StoryInspector({ story, onChange }: StoryInspectorProps) {
  return (
    <aside className="validation-list">
      <h3>Story Inspector</h3>
      <label className="field">
        <span>Title</span>
        <input value={story.title} onChange={(event) => onChange({ ...story, title: event.target.value })} />
      </label>
      <label className="field">
        <span>Stage</span>
        <input value={story.stage} onChange={(event) => onChange({ ...story, stage: event.target.value })} />
      </label>
      <label className="field">
        <span>Status</span>
        <select
          value={story.status}
          onChange={(event) => onChange({ ...story, status: event.target.value as Story["status"] })}
        >
          <option value="todo">todo</option>
          <option value="ready">ready</option>
          <option value="in_progress">in_progress</option>
          <option value="in_review">in_review</option>
          <option value="needs_revision">needs_revision</option>
          <option value="blocked">blocked</option>
          <option value="done">done</option>
        </select>
      </label>
      <label className="field">
        <span>Priority</span>
        <input
          type="number"
          min={1}
          step={1}
          value={story.priority}
          onChange={(event) => onChange({ ...story, priority: parsePositiveInteger(event.target.value) })}
        />
      </label>
      <label className="field">
        <span>Inputs, one per line</span>
        <textarea
          rows={5}
          value={story.inputs.join("\n")}
          onChange={(event) =>
            onChange({
              ...story,
              inputs: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="field">
        <span>Outputs, one per line</span>
        <textarea
          rows={5}
          value={story.outputs.join("\n")}
          onChange={(event) =>
            onChange({
              ...story,
              outputs: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <fieldset className="field">
        <legend>Required gates</legend>
        {gateOptions.map((gate) => (
          <label key={gate} className="checkbox-field">
            <input
              type="checkbox"
              value={gate}
              checked={story.review_policy.required_gates.includes(gate)}
              onChange={(event) => {
                const requiredGates = event.target.checked
                  ? [...story.review_policy.required_gates, gate]
                  : story.review_policy.required_gates.filter((requiredGate) => requiredGate !== gate);
                onChange({
                  ...story,
                  review_policy: {
                    ...story.review_policy,
                    required_gates: gateOptions.filter((option) => requiredGates.includes(option)),
                  },
                });
              }}
            />
            <span>{gate}</span>
          </label>
        ))}
      </fieldset>
    </aside>
  );
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}
