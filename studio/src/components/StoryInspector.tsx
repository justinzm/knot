import type { Story } from "../lib/knot/types";

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
          value={story.priority}
          onChange={(event) => onChange({ ...story, priority: Number(event.target.value) })}
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
      <label className="field">
        <span>Required gates, comma-separated</span>
        <input
          value={story.review_policy.required_gates.join(", ")}
          onChange={(event) =>
            onChange({
              ...story,
              review_policy: {
                ...story.review_policy,
                required_gates: event.target.value
                  .split(",")
                  .map((gate) => gate.trim())
                  .filter(Boolean) as Story["review_policy"]["required_gates"],
              },
            })
          }
        />
      </label>
    </aside>
  );
}
