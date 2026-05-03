import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

const openRuntimeMock = vi.hoisted(() => vi.fn());

vi.mock("./lib/knot/tauri", () => ({
  openRuntime: openRuntimeMock,
}));

import { App } from "./App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

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
});
