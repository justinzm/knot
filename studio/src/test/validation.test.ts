import { describe, expect, it } from "vitest";
import { validateTaskboardBasics } from "../lib/knot/validation";
import type { Taskboard } from "../lib/knot/types";

const validTaskboard: Taskboard = {
  project: "demo",
  workflow: "content-production",
  description: "Demo content workflow",
  stories: [
    {
      id: "ST-001",
      title: "Create outline",
      stage: "outline",
      description: "Create the first outline artifact.",
      priority: 1,
      status: "ready",
      inputs: ["runtime/project-brief.md"],
      outputs: ["outputs/outline.md"],
      dependencies: [],
      acceptance_criteria: ["Outline exists"],
      review_policy: {
        required_gates: ["existence", "structure"],
        blocking: true,
      },
      notes: "",
    },
  ],
};

describe("validateTaskboardBasics", () => {
  it("accepts a minimal valid taskboard", () => {
    expect(validateTaskboardBasics(validTaskboard)).toEqual([]);
  });

  it("rejects duplicate story ids", () => {
    const duplicate = {
      ...validTaskboard,
      stories: [validTaskboard.stories[0], { ...validTaskboard.stories[0] }],
    };

    expect(validateTaskboardBasics(duplicate)).toContainEqual({
      path: "stories[1].id",
      message: "Story id ST-001 is duplicated.",
      severity: "error",
    });
  });

  it("rejects taskboards with no stories", () => {
    expect(validateTaskboardBasics({ ...validTaskboard, stories: [] })).toContainEqual({
      path: "stories",
      message: "Taskboard must contain at least one story.",
      severity: "error",
    });
  });

  it("rejects stories with no required gates", () => {
    const invalid = {
      ...validTaskboard,
      stories: [
        {
          ...validTaskboard.stories[0],
          review_policy: {
            ...validTaskboard.stories[0].review_policy,
            required_gates: [],
          },
        },
      ],
    };

    expect(validateTaskboardBasics(invalid)).toContainEqual({
      path: "stories[0].review_policy.required_gates",
      message: "Story must require at least one gate.",
      severity: "error",
    });
  });

  it("rejects unknown required gates", () => {
    const invalid = {
      ...validTaskboard,
      stories: [
        {
          ...validTaskboard.stories[0],
          review_policy: {
            ...validTaskboard.stories[0].review_policy,
            required_gates: ["existence", "unsafe"] as typeof validTaskboard.stories[0]["review_policy"]["required_gates"],
          },
        },
      ],
    };

    expect(validateTaskboardBasics(invalid)).toContainEqual({
      path: "stories[0].review_policy.required_gates[1]",
      message: "Gate unsafe is not supported.",
      severity: "error",
    });
  });

  it("rejects absolute and parent traversal paths", () => {
    const invalid = {
      ...validTaskboard,
      stories: [
        {
          ...validTaskboard.stories[0],
          inputs: ["/tmp/input.md", "../secret.md"],
        },
      ],
    };

    expect(validateTaskboardBasics(invalid).map((issue) => issue.path)).toEqual([
      "stories[0].inputs[0]",
      "stories[0].inputs[1]",
    ]);
  });

  it("rejects nested traversal and Windows absolute paths", () => {
    const invalid = {
      ...validTaskboard,
      stories: [
        {
          ...validTaskboard.stories[0],
          inputs: [
            "outputs/../../secret.md",
            "outputs\\..\\..\\secret.md",
            "C:\\secret.md",
            "\\\\server\\share\\file.md",
          ],
        },
      ],
    };

    expect(validateTaskboardBasics(invalid).map((issue) => issue.path)).toEqual([
      "stories[0].inputs[0]",
      "stories[0].inputs[1]",
      "stories[0].inputs[2]",
      "stories[0].inputs[3]",
    ]);
  });
});
