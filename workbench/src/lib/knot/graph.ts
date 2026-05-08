import type { Story } from "./types";

export function dependentStoryIds(stories: Story[], targetId: string): string[] {
  return stories
    .filter((story) => story.dependencies.includes(targetId))
    .map((story) => story.id);
}

export function detectDependencyCycle(stories: Story[]): string[] {
  const storyIds = new Set(stories.map((story) => story.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  function visit(id: string): string[] {
    if (visiting.has(id)) {
      const start = path.indexOf(id);
      return start >= 0 ? path.slice(start).concat(id) : [id];
    }

    if (visited.has(id) || !storyIds.has(id)) {
      return [];
    }

    visiting.add(id);
    path.push(id);

    const story = stories.find((item) => item.id === id);
    for (const dependency of story?.dependencies ?? []) {
      const cycle = visit(dependency);
      if (cycle.length > 0) {
        return cycle;
      }
    }

    visiting.delete(id);
    visited.add(id);
    path.pop();
    return [];
  }

  for (const story of stories) {
    const cycle = visit(story.id);
    if (cycle.length > 0) {
      return cycle;
    }
  }

  return [];
}

export function wouldCreateCycle(
  stories: Story[],
  storyId: string,
  dependencies: string[],
): string[] {
  return detectDependencyCycle(
    stories.map((story) =>
      story.id === storyId ? { ...story, dependencies } : story,
    ),
  );
}
