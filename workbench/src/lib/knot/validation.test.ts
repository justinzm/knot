import { describe, expect, it } from "vitest";
import { createDefaultRuntime } from "./taskboard";
import { validateRuntimeDraft } from "./validation";

describe("runtime validation", () => {
  it("reports missing project path and unsafe story paths", () => {
    const draft = createDefaultRuntime();
    const taskboard = {
      ...draft.taskboard,
      stories: [
        {
          ...draft.taskboard.stories[0],
          outputs: ["../outside.md"],
        },
      ],
    };

    const issues = validateRuntimeDraft(null, draft.brief, draft.spec, taskboard);

    expect(issues.some((issue) => issue.field === "project_path")).toBe(true);
    expect(issues.some((issue) => issue.message.includes("../outside.md"))).toBe(true);
  });
});
