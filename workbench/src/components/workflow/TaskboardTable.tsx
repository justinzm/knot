import {
  STORY_STATUSES,
  STORY_STATUS_LABELS,
  createStory,
  nextStoryId,
} from "../../lib/knot/taskboard";
import type { ProjectSpec, Story, Taskboard } from "../../lib/knot/types";

interface TaskboardTableProps {
  taskboard: Taskboard;
  spec: ProjectSpec;
  selectedStoryId: string;
  readOnly: boolean;
  onChange: (taskboard: Taskboard) => void;
  onSelect: (storyId: string) => void;
  onDelete: (storyId: string) => void;
}

export function TaskboardTable({
  taskboard,
  spec,
  selectedStoryId,
  readOnly,
  onChange,
  onSelect,
  onDelete,
}: TaskboardTableProps) {
  function updateStory(nextStory: Story) {
    onChange({
      ...taskboard,
      stories: taskboard.stories.map((story) =>
        story.id === nextStory.id ? nextStory : story,
      ),
    });
  }

  function addStory() {
    const id = nextStoryId(taskboard.stories, spec.naming.story_prefix);
    onChange({
      ...taskboard,
      stories: [
        ...taskboard.stories,
        createStory(id, "新的内容单元", spec.workflow.stages[0], []),
      ],
    });
    onSelect(id);
  }

  return (
    <section className="workflow-panel taskboard-table">
      <div className="panel-heading">
        <h2>任务板</h2>
        <button type="button" disabled={readOnly} onClick={addStory}>
          新增内容单元
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>内容单元</th>
            <th>阶段</th>
            <th>状态</th>
            <th>优先级</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {taskboard.stories.map((story) => (
            <tr key={story.id} data-active={story.id === selectedStoryId}>
              <td>
                <button type="button" onClick={() => onSelect(story.id)}>
                  {story.id} · {story.title}
                </button>
              </td>
              <td>{story.stage}</td>
              <td>
                <select
                  value={story.status}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateStory({ ...story, status: event.currentTarget.value as Story["status"] })
                  }
                >
                  {STORY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STORY_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={story.priority}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateStory({ ...story, priority: Number(event.currentTarget.value) })
                  }
                />
              </td>
              <td>
                <button type="button" disabled={readOnly} onClick={() => onDelete(story.id)}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
