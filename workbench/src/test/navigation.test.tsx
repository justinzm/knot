import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const invokeMock = vi.hoisted(() => vi.fn());
const listenMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));
vi.mock("@tauri-apps/api/event", () => ({ listen: listenMock }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn() }));

beforeEach(() => {
  listenMock.mockResolvedValue(() => undefined);
  invokeMock.mockImplementation((command: string, args?: unknown) => {
    if (command === "get_settings") {
      return Promise.resolve({
        default_cli: "claude",
        max_iterations: 10,
        scan_exclusions: [".git"],
        theme: "dark",
        template_source: "bundled",
        recent_projects: [],
      });
    }
    if (command === "get_template_summary") {
      return Promise.resolve({
        template_path: "/template",
        has_core: true,
        has_automation: true,
        has_runtime: true,
        runtime_files: [],
      });
    }
    if (command === "detect_ai_clis") {
      return Promise.resolve([]);
    }
    if (command === "get_app_status") {
      return Promise.resolve({
        product_name: "Knot Workbench",
        phase: "第 10 阶段",
        rust_bridge: true,
      });
    }
    if (command === "save_settings") {
      return Promise.resolve((args as { settings: unknown }).settings);
    }
    return Promise.reject(new Error(`Unhandled command: ${command}`));
  });
});

afterEach(() => {
  cleanup();
  invokeMock.mockReset();
  listenMock.mockReset();
});

describe("navigation", () => {
  it("keeps logo and seven Chinese navigation entries", () => {
    render(<App />);

    expect(screen.getAllByText("Knot Workbench")).toHaveLength(2);
    for (const label of ["总览", "准备项目", "运行时", "工作流", "预检", "运行", "产物"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "设置" })).toBeNull();
  });

  it("opens the prepare page from the sidebar footer button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "切换项目" }));

    expect(screen.getByRole("heading", { name: "选择项目并检查运行环境", level: 1 })).toBeTruthy();
  });
});
