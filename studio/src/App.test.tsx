import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

const openRuntimeMock = vi.hoisted(() => vi.fn());
const saveProjectBriefMock = vi.hoisted(() => vi.fn());
const saveProjectSpecMock = vi.hoisted(() => vi.fn());
const saveTaskboardMock = vi.hoisted(() => vi.fn());

vi.mock("./lib/knot/tauri", () => ({
  openRuntime: openRuntimeMock,
  saveProjectBrief: saveProjectBriefMock,
  saveProjectSpec: saveProjectSpecMock,
  saveTaskboard: saveTaskboardMock,
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

  it("renders taskboard validation for loaded runtimes", async () => {
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
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toContain('"stories"');
    expect(container.textContent).toContain("No client-side issues.");
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Save taskboard");

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
