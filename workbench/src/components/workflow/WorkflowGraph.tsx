import type { Story } from "../../lib/knot/types";

interface WorkflowGraphProps {
  stages: string[];
  stories: Story[];
  selectedStoryId: string;
  onSelect: (storyId: string) => void;
}

export function WorkflowGraph({
  stages,
  stories,
  selectedStoryId,
  onSelect,
}: WorkflowGraphProps) {
  return (
    <section className="workflow-panel workflow-graph">
      <div className="panel-heading">
        <h2>阶段视图</h2>
        <span>{stories.length} 个 story</span>
      </div>
      <div className="stage-lanes">
        {stages.map((stage) => (
          <div key={stage} className="stage-lane">
            <h3>{stage}</h3>
            {stories
              .filter((story) => story.stage === stage)
              .map((story) => (
                <button
                  key={story.id}
                  type="button"
                  className="story-node"
                  data-active={story.id === selectedStoryId}
                  onClick={() => onSelect(story.id)}
                >
                  <strong>{story.id}</strong>
                  <span>{story.title}</span>
                  <small>{story.dependencies.length} 个依赖</small>
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
