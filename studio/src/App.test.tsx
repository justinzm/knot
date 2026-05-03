import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

const openRuntimeMock = vi.hoisted(() => vi.fn());
const saveProjectBriefMock = vi.hoisted(() => vi.fn());
const saveProjectSpecMock = vi.hoisted(() => vi.fn());
const saveTaskboardMock = vi.hoisted(() => vi.fn());
const runPreflightMock = vi.hoisted(() => vi.fn());
const runLoopOnceMock = vi.hoisted(() => vi.fn());

vi.mock("./lib/knot/tauri", () => ({
  openRuntime: openRuntimeMock,
  saveProjectBrief: saveProjectBriefMock,
  saveProjectSpec: saveProjectSpecMock,
  saveTaskboard: saveTaskboardMock,
  runPreflight: runPreflightMock,
  runLoopOnce: runLoopOnceMock,
}));

import { App } from "./App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  valueSetter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  valueSetter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickNavItem(container: HTMLElement, label: string) {
  (Array.from(container.querySelectorAll(".nav-item")).find((button) =>
    button.textContent?.includes(label),
  ) as HTMLButtonElement).click();
}

const loadedSnapshot = {
  knotRoot: "/tmp/project/knot",
  projectBrief: "# Demo brief\n",
  projectSpecJson: `${JSON.stringify({
    project_id: "demo",
    project_type: "video",
    target_medium: "short-form",
    language: "English",
    audience: "Editors",
    style: {
      voice: "clear",
      visual_style: "clean",
      tone: "practical",
    },
    workflow: {
      stages: ["brief", "draft"],
      artifact_root: "outputs",
      fact_root: "facts",
      review_root: "reviews",
    },
    review_policy: {
      required_gates: ["existence"],
      notes: "Check files.",
    },
    naming: {
      story_prefix: "S",
      artifact_convention: "story-id",
    },
  })}\n`,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: [],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
    ],
  })}\n`,
  progressText: "",
};

const duplicateStoryIdsSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: [],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
      {
        id: "S1",
        title: "Review scene",
        stage: "review",
        description: "Review the scene.",
        priority: 2,
        status: "todo",
        inputs: ["outputs/scene.md"],
        outputs: ["outputs/scene-reviewed.md"],
        dependencies: [],
        acceptance_criteria: ["Review exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
    ],
  })}\n`,
};

const dependencyCycleSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: ["S2"],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
      {
        id: "S2",
        title: "Review scene",
        stage: "review",
        description: "Review the scene.",
        priority: 2,
        status: "ready",
        inputs: ["outputs/scene.md"],
        outputs: ["outputs/scene-reviewed.md"],
        dependencies: ["S1"],
        acceptance_criteria: ["Review exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
    ],
  })}\n`,
};

const missingDependencySnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: ["S404"],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
    ],
  })}\n`,
};

const gateRulesSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: [],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence", "structure"],
        },
        notes: "",
      },
      {
        id: "S2",
        title: "Editorial pass",
        stage: "review",
        description: "Review the scene.",
        priority: 2,
        status: "ready",
        inputs: ["outputs/scene.md"],
        outputs: ["outputs/scene-reviewed.md"],
        dependencies: ["S1"],
        acceptance_criteria: ["Review exists."],
        review_policy: {
          required_gates: ["editorial"],
          blocking: false,
        },
        notes: "",
      },
    ],
  })}\n`,
};

const emptyTaskboardSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [],
  })}\n`,
};

const duplicateWorkflowRowsSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    project: "demo",
    workflow: "produce",
    description: "Demo taskboard",
    stories: [
      {
        id: "S1",
        title: "Draft scene",
        stage: "draft",
        description: "Write the scene.",
        priority: 1,
        status: "todo",
        inputs: ["script/source.md"],
        outputs: ["outputs/scene.md"],
        dependencies: [],
        acceptance_criteria: ["Scene exists."],
        review_policy: {
          required_gates: ["existence"],
        },
        notes: "",
      },
      {
        id: "S1",
        title: "Review scene",
        stage: "review",
        description: "Review the scene.",
        priority: 2,
        status: "ready",
        inputs: ["outputs/scene.md"],
        outputs: ["outputs/scene-reviewed.md"],
        dependencies: [],
        acceptance_criteria: ["Review exists."],
        review_policy: {
          required_gates: ["editorial"],
          blocking: false,
        },
        notes: "",
      },
      {
        id: "S3",
        title: "Publish scene",
        stage: "publish",
        description: "Publish the scene.",
        priority: 3,
        status: "blocked",
        inputs: ["outputs/scene-reviewed.md"],
        outputs: ["outputs/scene-published.md"],
        dependencies: ["S1", "S1", "S404", "S404"],
        acceptance_criteria: ["Publish exists."],
        review_policy: {
          required_gates: ["compliance"],
        },
        notes: "",
      },
    ],
  })}\n`,
};

const invalidRequiredGatesSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    ...JSON.parse(loadedSnapshot.taskboardJson),
    stories: [
      {
        ...JSON.parse(loadedSnapshot.taskboardJson).stories[0],
        review_policy: {
          required_gates: ["unsafe"],
        },
      },
    ],
  })}\n`,
};

const emptyRequiredGatesSnapshot = {
  ...loadedSnapshot,
  taskboardJson: `${JSON.stringify({
    ...JSON.parse(loadedSnapshot.taskboardJson),
    stories: [
      {
        ...JSON.parse(loadedSnapshot.taskboardJson).stories[0],
        review_policy: {
          required_gates: [],
        },
      },
    ],
  })}\n`,
};

async function renderApp() {
  const container = document.createElement("div");
  document.body.append(container);

  const root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });

  return {
    container,
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("App", () => {
  beforeEach(() => {
    openRuntimeMock.mockReset();
    saveProjectBriefMock.mockReset();
    saveProjectSpecMock.mockReset();
    saveTaskboardMock.mockReset();
    runPreflightMock.mockReset();
    runLoopOnceMock.mockReset();
  });

  it("renders the runtime loading shell", async () => {
    const { container, cleanup } = await renderApp();

    expect(container.querySelector("h1")?.textContent).toBe("Knot Studio");
    expect(container.textContent).toContain("Settings");
    expect(container.textContent).toContain("No project selected");
    expect(container.textContent).toContain("idle");
    expect(container.querySelector(".nav-item.active")?.getAttribute("aria-current")).toBe("page");
    expect(
      Array.from(container.querySelectorAll(".nav-item:not(.active)")).every(
        (button) => !button.hasAttribute("aria-current"),
      ),
    ).toBe(true);
    expect(container.textContent).toContain("Open Local Knot Project");
    expect(container.querySelector("input")?.getAttribute("placeholder")).toBe(
      "/Users/example/my-content-project",
    );
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Open runtime");

    await cleanup();
  });

  it("renders string runtime load errors", async () => {
    openRuntimeMock.mockRejectedValueOnce("plain failure");
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/knot");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(container.querySelector(".error-text")?.textContent).toBe("plain failure");

    await cleanup();
  });

  it("renders object runtime load error messages", async () => {
    openRuntimeMock.mockRejectedValueOnce({ message: "object failure" });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/knot");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(container.querySelector(".error-text")?.textContent).toBe("object failure");

    await cleanup();
  });

  it("renders the project brief editor for loaded runtimes", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Project Brief");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Project Brief");
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("# Demo brief\n");
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Save brief");

    await cleanup();
  });

  it("renders the project spec editor for loaded runtimes", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Project Spec");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Project Spec");
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("demo");
    expect(container.textContent).toContain("Stages, comma-separated");
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Save spec");

    await cleanup();
  });

  it("renders the validation center on overview and validation sections", async () => {
    openRuntimeMock.mockResolvedValueOnce(dependencyCycleSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(container.querySelector("h2")?.textContent).toBe("Validation Center");
    expect(container.textContent).toContain("dependency cycle");
    expect(container.textContent).toContain("S1 -> S2 -> S1");

    await act(async () => {
      clickNavItem(container, "Validation Center");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Validation Center");
    expect(container.textContent).toContain("dependency cycle");

    await cleanup();
  });

  it("renders missing dependencies in the validation center", async () => {
    openRuntimeMock.mockResolvedValueOnce(missingDependencySnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(container.querySelector("h2")?.textContent).toBe("Validation Center");
    expect(container.textContent).toContain("missing dependency");
    expect(container.textContent).toContain("S404 -> S1");

    await cleanup();
  });

  it("renders the workflow builder with stages, dependencies, and missing dependencies", async () => {
    openRuntimeMock.mockResolvedValueOnce(missingDependencySnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Workflow Builder");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Workflow Builder");
    expect(container.textContent).toContain("draft");
    expect(container.textContent).toContain("S1");
    expect(container.textContent).toContain("Draft scene");
    expect(container.textContent).toContain("todo");
    expect(container.textContent).toContain("Missing Dependencies");
    expect(container.textContent).toContain("S404 -> S1");

    await cleanup();
  });

  it("renders gate rules for loaded runtimes", async () => {
    openRuntimeMock.mockResolvedValueOnce(gateRulesSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Gate Rules");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Gate Rules");
    expect(container.textContent).toContain("S1");
    expect(container.textContent).toContain("Draft scene");
    expect(container.textContent).toContain("existence, structure");
    expect(container.textContent).toContain("blocking");
    expect(container.textContent).toContain("S2");
    expect(container.textContent).toContain("Editorial pass");
    expect(container.textContent).toContain("editorial");
    expect(container.textContent).toContain("non-blocking");

    await cleanup();
  });

  it("runs preflight and loop commands from the run console", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    runPreflightMock.mockResolvedValueOnce({
      status: "pass",
      exitCode: 0,
      stdout: "preflight ok",
      stderr: "",
    });
    runLoopOnceMock.mockResolvedValueOnce({
      status: "fail",
      exitCode: 2,
      stdout: "loop output",
      stderr: "loop failed",
    });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Run Console");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Run Console");
    expect(container.textContent).toContain("No command has run yet.");

    await act(async () => {
      (Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Run preflight"),
      ) as HTMLButtonElement).click();
    });

    expect(runPreflightMock).toHaveBeenCalledWith("/tmp/project/knot");
    expect(container.textContent).toContain("status: pass");
    expect(container.textContent).toContain("exitCode: 0");
    expect(container.textContent).toContain("preflight ok");

    await act(async () => {
      setSelectValue(container.querySelector("select") as HTMLSelectElement, "amp");
    });
    await act(async () => {
      (Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Start loop"),
      ) as HTMLButtonElement).click();
    });

    expect(runLoopOnceMock).toHaveBeenCalledWith("/tmp/project/knot", "amp", 10);
    expect(container.textContent).toContain("status: fail");
    expect(container.textContent).toContain("exitCode: 2");
    expect(container.textContent).toContain("loop output");
    expect(container.textContent).toContain("loop failed");

    await cleanup();
  });

  it("renders run command rejection errors", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    runPreflightMock.mockRejectedValueOnce({ message: "preflight rejected" });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Run Console");
    });
    await act(async () => {
      (Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Run preflight"),
      ) as HTMLButtonElement).click();
    });

    expect(container.querySelector(".error-text")?.textContent).toBe("preflight rejected");
    expect(container.textContent).toContain("No command has run yet.");

    await cleanup();
  });

  it("renders explicit empty states for workflow and gate sections", async () => {
    openRuntimeMock.mockResolvedValueOnce(emptyTaskboardSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Workflow Builder");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Workflow Builder");
    expect(container.textContent).toContain("No stories found");

    await act(async () => {
      clickNavItem(container, "Gate Rules");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Gate Rules");
    expect(container.textContent).toContain("No stories found");

    await cleanup();
  });

  it("renders duplicate workflow and gate rows without React key warnings", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    openRuntimeMock.mockResolvedValueOnce(duplicateWorkflowRowsSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    consoleErrorSpy.mockClear();
    await act(async () => {
      clickNavItem(container, "Workflow Builder");
    });

    expect(container.textContent).toContain("S1 -> S3");
    expect(container.textContent).toContain("S404 -> S3");

    await act(async () => {
      clickNavItem(container, "Gate Rules");
    });

    expect(container.textContent).toContain("Review scene");
    expect(container.textContent).toContain("non-blocking");
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call.some((part) => String(part).includes("Encountered two children with the same key")),
      ),
    ).toBe(false);

    consoleErrorSpy.mockRestore();
    await cleanup();
  });

  it("renders the taskboard story list and inspector for loaded runtimes", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    expect(container.querySelector("h2")?.textContent).toBe("Taskboard");
    expect(container.textContent).toContain("Draft scene");
    expect(container.textContent).toContain("Story Inspector");
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("Draft scene");
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Save taskboard");

    await cleanup();
  });

  it("saves taskboard edits made in the story inspector", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    saveTaskboardMock.mockResolvedValueOnce({
      ...loadedSnapshot,
      taskboardJson: `${JSON.stringify({
        ...JSON.parse(loadedSnapshot.taskboardJson),
        stories: [
          {
            ...JSON.parse(loadedSnapshot.taskboardJson).stories[0],
            title: "Revised scene",
            status: "ready",
            inputs: ["script/source.md", "script/context.md"],
          },
        ],
      })}\n`,
    });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    const fields = Array.from(container.querySelectorAll("input"));
    await act(async () => {
      setInputValue(fields[0] as HTMLInputElement, "Revised scene");
    });
    await act(async () => {
      setSelectValue(container.querySelector("select") as HTMLSelectElement, "ready");
    });
    await act(async () => {
      setTextareaValue(
        container.querySelector("textarea") as HTMLTextAreaElement,
        "script/source.md\nscript/context.md",
      );
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    const savedTaskboard = JSON.parse(saveTaskboardMock.mock.calls[0][1]);
    expect(savedTaskboard.stories[0].title).toBe("Revised scene");
    expect(savedTaskboard.stories[0].status).toBe("ready");
    expect(savedTaskboard.stories[0].inputs).toEqual(["script/source.md", "script/context.md"]);
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("Revised scene");

    await cleanup();
  });

  it("keeps invalid priority edits from being saved", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    saveTaskboardMock.mockResolvedValueOnce(loadedSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    const priorityInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.getAttribute("type") === "number",
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(priorityInput, "0");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(priorityInput.value).toBe("1");
    expect(JSON.parse(saveTaskboardMock.mock.calls[0][1]).stories[0].priority).toBe(1);

    await cleanup();
  });

  it("renders required gates as fixed choices", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    const gateCheckboxes = Array.from(container.querySelectorAll("input[type='checkbox']")) as HTMLInputElement[];
    expect(container.textContent).not.toContain("Required gates, comma-separated");
    expect(gateCheckboxes.map((checkbox) => checkbox.value)).toEqual([
      "existence",
      "structure",
      "business",
      "compliance",
      "continuity",
      "editorial",
      "brand",
      "custom",
    ]);

    await cleanup();
  });

  it("renders rejected project brief save errors", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    saveProjectBriefMock.mockRejectedValueOnce({ message: "save failed" });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Project Brief");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect(container.querySelector(".error-text")?.textContent).toBe("save failed");
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Save brief");

    await cleanup();
  });

  it("disables taskboard save when duplicate story ids are present", async () => {
    openRuntimeMock.mockResolvedValueOnce(duplicateStoryIdsSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    expect(container.textContent).toContain("Story id S1 is duplicated.");
    expect((container.querySelector("button.primary-button") as HTMLButtonElement).disabled).toBe(true);

    await cleanup();
  });

  it("disables taskboard save when no stories are present", async () => {
    openRuntimeMock.mockResolvedValueOnce(emptyTaskboardSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    expect(container.textContent).toContain("Taskboard must contain at least one story.");
    expect((container.querySelector("button.primary-button") as HTMLButtonElement).disabled).toBe(true);

    await cleanup();
  });

  it("disables taskboard save when loaded required gates are invalid", async () => {
    openRuntimeMock.mockResolvedValueOnce(invalidRequiredGatesSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    expect(container.textContent).toContain("Gate unsafe is not supported.");
    expect((container.querySelector("button.primary-button") as HTMLButtonElement).disabled).toBe(true);

    await cleanup();
  });

  it("disables taskboard save when all required gates are unchecked", async () => {
    openRuntimeMock.mockResolvedValueOnce(emptyRequiredGatesSnapshot);
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Taskboard");
    });

    expect(container.textContent).toContain("Story must require at least one gate.");
    expect((container.querySelector("button.primary-button") as HTMLButtonElement).disabled).toBe(true);

    await cleanup();
  });

  it("syncs the project brief draft when the snapshot content changes", async () => {
    openRuntimeMock.mockResolvedValueOnce(loadedSnapshot);
    saveProjectBriefMock.mockResolvedValueOnce({
      ...loadedSnapshot,
      projectBrief: "# Server updated brief\n",
    });
    const { container, cleanup } = await renderApp();

    await act(async () => {
      setInputValue(container.querySelector("input") as HTMLInputElement, "/tmp/project");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });
    await act(async () => {
      clickNavItem(container, "Project Brief");
    });
    await act(async () => {
      setTextareaValue(container.querySelector("textarea") as HTMLTextAreaElement, "# Local edit\n");
    });
    await act(async () => {
      (container.querySelector("button.primary-button") as HTMLButtonElement).click();
    });

    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe(
      "# Server updated brief\n",
    );

    await cleanup();
  });
});
