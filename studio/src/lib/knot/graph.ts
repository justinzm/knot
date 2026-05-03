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
  missingDependencies: WorkflowEdge[];
}

export function taskboardToGraph(taskboard: Taskboard): WorkflowGraph {
  const storyIds = new Set(taskboard.stories.map((story) => story.id));
  const edges: WorkflowEdge[] = [];
  const missingDependencies: WorkflowEdge[] = [];

  taskboard.stories.forEach((story) => {
    story.dependencies.forEach((dependency) => {
      const edge = { from: dependency, to: story.id };
      if (storyIds.has(dependency)) {
        edges.push(edge);
      } else {
        missingDependencies.push(edge);
      }
    });
  });

  return {
    nodes: taskboard.stories.map((story) => ({
      id: story.id,
      label: story.title,
      stage: story.stage,
      status: story.status,
    })),
    edges,
    missingDependencies,
  };
}

export function detectDependencyCycles(taskboard: Taskboard): string[][] {
  const dependenciesByStory = new Map<string, string[]>();
  const storyIds = new Set(taskboard.stories.map((story) => story.id));
  taskboard.stories.forEach((story) =>
    dependenciesByStory.set(
      story.id,
      story.dependencies.filter((dependency) => storyIds.has(dependency)),
    ),
  );

  const cyclesByKey = new Map<string, string[]>();

  function canonicalizeCycle(cycle: string[]): string[] {
    const cycleNodes = cycle.slice(0, -1);
    let firstIndex = 0;
    cycleNodes.forEach((storyId, index) => {
      if (storyId.localeCompare(cycleNodes[firstIndex]) < 0) {
        firstIndex = index;
      }
    });

    const canonicalNodes = [...cycleNodes.slice(firstIndex), ...cycleNodes.slice(0, firstIndex)];
    return [...canonicalNodes, canonicalNodes[0]];
  }

  function recordCycle(cycle: string[]): void {
    const canonicalCycle = canonicalizeCycle(cycle);
    cyclesByKey.set(canonicalCycle.join("\0"), canonicalCycle);
  }

  function visit(startId: string, storyId: string, path: string[]): void {
    const dependencies = dependenciesByStory.get(storyId) ?? [];
    dependencies.forEach((dependency) => {
      if (dependency === startId) {
        recordCycle([...path, startId]);
        return;
      }
      if (!path.includes(dependency)) {
        visit(startId, dependency, [...path, dependency]);
      }
    });
  }

  taskboard.stories.forEach((story) => visit(story.id, story.id, [story.id]));
  return [...cyclesByKey.values()].sort((left, right) => {
    const leftKey = left.join("\0");
    const rightKey = right.join("\0");
    if (leftKey < rightKey) {
      return -1;
    }
    if (leftKey > rightKey) {
      return 1;
    }
    return 0;
  });
}
