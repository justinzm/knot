import type { StoryStatus, Taskboard } from "./types";

export interface WorkflowNode {
  id: string;
  label: string;
  stage: string;
  status: StoryStatus;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function taskboardToGraph(taskboard: Taskboard): WorkflowGraph {
  return {
    nodes: taskboard.stories.map((story) => ({
      id: story.id,
      label: story.title,
      stage: story.stage,
      status: story.status,
    })),
    edges: taskboard.stories.flatMap((story) =>
      story.dependencies.map((dependency) => ({
        from: dependency,
        to: story.id,
      })),
    ),
  };
}

export function detectDependencyCycles(taskboard: Taskboard): string[][] {
  const dependenciesByStory = new Map<string, string[]>();
  taskboard.stories.forEach((story) => dependenciesByStory.set(story.id, story.dependencies));

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const active = new Set<string>();

  function visit(storyId: string, path: string[]): void {
    if (active.has(storyId)) {
      const cycleStart = path.indexOf(storyId);
      cycles.push([...path.slice(cycleStart), storyId]);
      return;
    }
    if (visited.has(storyId)) {
      return;
    }

    visited.add(storyId);
    active.add(storyId);
    const dependencies = dependenciesByStory.get(storyId) ?? [];
    dependencies.forEach((dependency) => visit(dependency, [...path, storyId]));
    active.delete(storyId);
  }

  taskboard.stories.forEach((story) => visit(story.id, []));
  return cycles;
}
