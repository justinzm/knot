import { splitLines } from "../../lib/knot/taskboard";
import type { Story } from "../../lib/knot/types";

interface StoryInspectorProps {
  story: Story | null;
  stories: Story[];
  stages: string[];
  readOnly: boolean;
  onChange: (story: Story) => void;
  onDependenciesChange: (storyId: string, dependencies: string[]) => void;
}

export function StoryInspector({
  story,
  stories,
  stages,
  readOnly,
  onChange,
  onDependenciesChange,
}: StoryInspectorProps) {
  if (!story) {
    return (
      <section className="workflow-panel story-inspector">
        <h2>内容单元详情</h2>
        <p>请选择一个内容单元。</p>
      </section>
    );
  }

  return (
    <section className="workflow-panel story-inspector">
      <div className="panel-heading">
        <h2>内容单元详情</h2>
        <span>{story.id}</span>
      </div>
      <div className="form-grid">
        <label>
          标题
          <input
            value={story.title}
            disabled={readOnly}
            onChange={(event) => onChange({ ...story, title: event.currentTarget.value })}
          />
        </label>
        <label>
          阶段
          <select
            value={story.stage}
            disabled={readOnly}
            onChange={(event) => onChange({ ...story, stage: event.currentTarget.value })}
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        描述
        <textarea
          rows={4}
          value={story.description}
          disabled={readOnly}
          onChange={(event) => onChange({ ...story, description: event.currentTarget.value })}
        />
      </label>
      <label>
        输入路径
        <textarea
          rows={3}
          value={story.inputs.join("\n")}
          disabled={readOnly}
          onChange={(event) => onChange({ ...story, inputs: splitLines(event.currentTarget.value) })}
        />
      </label>
      <label>
        输出路径
        <textarea
          rows={3}
          value={story.outputs.join("\n")}
          disabled={readOnly}
          onChange={(event) => onChange({ ...story, outputs: splitLines(event.currentTarget.value) })}
        />
      </label>
      <div className="dependency-list">
        <strong>依赖</strong>
        {stories
          .filter((candidate) => candidate.id !== story.id)
          .map((candidate) => (
            <label key={candidate.id}>
              <input
                type="checkbox"
                disabled={readOnly}
                checked={story.dependencies.includes(candidate.id)}
                onChange={() => {
                  const dependencies = story.dependencies.includes(candidate.id)
                    ? story.dependencies.filter((id) => id !== candidate.id)
                    : [...story.dependencies, candidate.id];
                  onDependenciesChange(story.id, dependencies);
                }}
              />
              {candidate.id} · {candidate.title}
            </label>
          ))}
      </div>
    </section>
  );
}
