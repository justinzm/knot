import { describe, expect, it } from "vitest";
import { detectDependencyCycle } from "../lib/knot/graph";
import { createDefaultRuntime } from "../lib/knot/taskboard";
import { validateRuntimeDraft } from "../lib/knot/validation";

describe("validation helpers", () => {
  it("blocks dependency cycles and unsafe paths", () => {
    const draft = createDefaultRuntime();
    const stories = [
      { ...draft.taskboard.stories[0], id: "ST-001", dependencies: ["ST-002"] },
      { ...draft.taskboard.stories[0], id: "ST-002", dependencies: ["ST-001"] },
    ];
    const taskboard = {
      ...draft.taskboard,
      stories: [{ ...stories[0], outputs: ["../bad.md"] }, stories[1]],
    };

    const issues = validateRuntimeDraft("/tmp/project", draft.brief, draft.spec, taskboard);

    expect(detectDependencyCycle(stories)).toEqual(["ST-001", "ST-002", "ST-001"]);
    expect(issues.some((issue) => issue.field === "dependencies")).toBe(true);
    expect(issues.some((issue) => issue.message.includes("../bad.md"))).toBe(true);
  });
});
