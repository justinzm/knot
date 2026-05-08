import { useMemo, useState } from "react";
import { wouldCreateCycle } from "../lib/knot/graph";
import {
  createDefaultRuntime,
  createStory,
  deleteStory,
  nextStoryId,
  replaceStory,
} from "../lib/knot/taskboard";
import type { ProjectSpec, Story, Taskboard } from "../lib/knot/types";

export function useRuntimeWorkspace() {
  const [draft, setDraft] = useState(createDefaultRuntime);
  const [selectedStoryId, setSelectedStoryId] = useState(
    draft.taskboard.stories[0]?.id ?? "",
  );
  const [isRuntimeRunning, setIsRuntimeRunning] = useState(false);
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);

  const selectedStory = useMemo(
    () =>
      draft.taskboard.stories.find((story) => story.id === selectedStoryId) ??
      draft.taskboard.stories[0] ??
      null,
    [draft.taskboard.stories, selectedStoryId],
  );

  function updateBrief(brief: string) {
    setDraft((current) => ({ ...current, brief }));
  }

  function updateSpec(spec: ProjectSpec) {
    setDraft((current) => ({ ...current, spec }));
  }

  function updateTaskboard(taskboard: Taskboard) {
    setDraft((current) => ({ ...current, taskboard }));
  }

  function updateStory(story: Story) {
    setDraft((current) => ({
      ...current,
      taskboard: {
        ...current.taskboard,
        stories: replaceStory(current.taskboard.stories, story),
      },
    }));
  }

  function updateStoryDependencies(storyId: string, dependencies: string[]) {
    const cycle = wouldCreateCycle(draft.taskboard.stories, storyId, dependencies);
    if (cycle.length > 0) {
      setRuntimeMessage(`依赖环：${cycle.join(" → ")}`);
      return false;
    }

    updateStory({
      ...draft.taskboard.stories.find((story) => story.id === storyId)!,
      dependencies,
    });
    setRuntimeMessage(null);
    return true;
  }

  function addStory() {
    const id = nextStoryId(draft.taskboard.stories, draft.spec.naming.story_prefix);
    const story = createStory(id, "新的内容单元", draft.spec.workflow.stages[0], []);
    setDraft((current) => ({
      ...current,
      taskboard: {
        ...current.taskboard,
        stories: [...current.taskboard.stories, story],
      },
    }));
    setSelectedStoryId(id);
    setRuntimeMessage(`已新增 ${id}`);
  }

  function removeStory(storyId: string) {
    const result = deleteStory(draft.taskboard.stories, storyId);
    setRuntimeMessage(result.error);
    if (result.error) {
      return false;
    }

    setDraft((current) => ({
      ...current,
      taskboard: { ...current.taskboard, stories: result.stories },
    }));
    setSelectedStoryId(result.stories[0]?.id ?? "");
    return true;
  }

  return {
    brief: draft.brief,
    spec: draft.spec,
    taskboard: draft.taskboard,
    selectedStory,
    selectedStoryId,
    isRuntimeRunning,
    runtimeMessage,
    setSelectedStoryId,
    setIsRuntimeRunning,
    setRuntimeMessage,
    updateBrief,
    updateSpec,
    updateTaskboard,
    updateStory,
    updateStoryDependencies,
    addStory,
    removeStory,
  };
}

export type RuntimeWorkspace = ReturnType<typeof useRuntimeWorkspace>;
