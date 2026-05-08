import { describe, expect, it } from "vitest";
import { detectDependencyCycle, wouldCreateCycle } from "./graph";
import { createStory, deleteStory } from "./taskboard";

describe("dependency graph", () => {
  it("detects dependency cycles by story id", () => {
    const first = createStory("ST-001", "第一步", "brief", ["ST-002"]);
    const second = createStory("ST-002", "第二步", "draft", ["ST-001"]);

    expect(detectDependencyCycle([first, second])).toEqual([
      "ST-001",
      "ST-002",
      "ST-001",
    ]);
  });

  it("checks proposed dependency edits before saving", () => {
    const first = createStory("ST-001", "第一步", "brief", []);
    const second = createStory("ST-002", "第二步", "draft", ["ST-001"]);

    expect(wouldCreateCycle([first, second], "ST-001", ["ST-002"])).toEqual([
      "ST-001",
      "ST-002",
      "ST-001",
    ]);
  });

  it("blocks deleting stories that are still depended on", () => {
    const first = createStory("ST-001", "第一步", "brief", []);
    const second = createStory("ST-002", "第二步", "draft", ["ST-001"]);

    const result = deleteStory([first, second], "ST-001");

    expect(result.stories).toHaveLength(2);
    expect(result.error).toContain("ST-002");
  });
});
