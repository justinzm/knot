import { describe, expect, it } from "vitest";
import { detectDependencyCycles, taskboardToGraph } from "../lib/knot/graph";
import type { Taskboard } from "../lib/knot/types";

const taskboard: Taskboard = {
  project: "demo",
  workflow: "content",
  description: "Demo",
  stories: [
    {
      id: "ST-001",
      title: "Outline",
      stage: "outline",
      description: "Create outline",
      priority: 1,
      status: "ready",
      inputs: ["runtime/project-brief.md"],
      outputs: ["outputs/outline.md"],
      dependencies: [],
      acceptance_criteria: ["Exists"],
      review_policy: { required_gates: ["existence"] },
      notes: "",
    },
    {
      id: "ST-002",
      title: "Draft",
      stage: "draft",
      description: "Create draft",
      priority: 2,
      status: "todo",
      inputs: ["outputs/outline.md"],
      outputs: ["outputs/draft.md"],
      dependencies: ["ST-001"],
      acceptance_criteria: ["Exists"],
      review_policy: { required_gates: ["existence"] },
      notes: "",
    },
  ],
};

describe("taskboardToGraph", () => {
  it("converts stories to nodes and dependencies to edges", () => {
    expect(taskboardToGraph(taskboard)).toEqual({
      nodes: [
        { id: "ST-001", label: "Outline", stage: "outline", status: "ready" },
        { id: "ST-002", label: "Draft", stage: "draft", status: "todo" },
      ],
      edges: [{ from: "ST-001", to: "ST-002" }],
      missingDependencies: [],
    });
  });

  it("excludes unknown dependency IDs from edges and reports them separately", () => {
    const withMissingDependency: Taskboard = {
      ...taskboard,
      stories: [
        taskboard.stories[0],
        { ...taskboard.stories[1], dependencies: ["ST-001", "ST-999"] },
      ],
    };

    expect(taskboardToGraph(withMissingDependency)).toEqual({
      nodes: [
        { id: "ST-001", label: "Outline", stage: "outline", status: "ready" },
        { id: "ST-002", label: "Draft", stage: "draft", status: "todo" },
      ],
      edges: [{ from: "ST-001", to: "ST-002" }],
      missingDependencies: [{ from: "ST-999", to: "ST-002" }],
    });
  });
});

describe("detectDependencyCycles", () => {
  it("returns no cycles for an acyclic board", () => {
    expect(detectDependencyCycles(taskboard)).toEqual([]);
  });

  it("returns cycle path for circular dependencies", () => {
    const cyclic: Taskboard = {
      ...taskboard,
      stories: [
        { ...taskboard.stories[0], dependencies: ["ST-002"] },
        { ...taskboard.stories[1], dependencies: ["ST-001"] },
      ],
    };

    expect(detectDependencyCycles(cyclic)).toEqual([["ST-001", "ST-002", "ST-001"]]);
  });

  it("returns deterministic cycles when branches share a node in cycles", () => {
    const sharedTailCyclic: Taskboard = {
      ...taskboard,
      stories: [
        { ...taskboard.stories[0], id: "A", title: "A", dependencies: ["B", "C"] },
        { ...taskboard.stories[1], id: "B", title: "B", dependencies: ["D"] },
        { ...taskboard.stories[1], id: "C", title: "C", dependencies: ["D"] },
        { ...taskboard.stories[1], id: "D", title: "D", dependencies: ["A"] },
      ],
    };

    expect(detectDependencyCycles(sharedTailCyclic)).toEqual([
      ["A", "B", "D", "A"],
      ["A", "C", "D", "A"],
    ]);
  });
});
