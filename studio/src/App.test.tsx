import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { App } from "./App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("App", () => {
  it("renders the runtime loading shell", async () => {
    const container = document.createElement("div");
    document.body.append(container);

    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    expect(container.querySelector("h1")?.textContent).toBe("Knot Studio");
    expect(container.textContent).toContain("Settings");
    expect(container.textContent).toContain("No project selected");
    expect(container.textContent).toContain("idle");
    expect(container.textContent).toContain("Open Local Knot Project");
    expect(container.querySelector("input")?.getAttribute("placeholder")).toBe(
      "/Users/example/my-content-project",
    );
    expect(container.querySelector("button.primary-button")?.textContent).toBe("Open runtime");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
