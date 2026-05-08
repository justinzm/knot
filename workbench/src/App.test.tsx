import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const invokeMock = vi.hoisted(() => vi.fn());
const openMock = vi.hoisted(() => vi.fn());
const listenMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: listenMock,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: openMock,
}));

const settingsResponse = {
  default_cli: "claude",
  max_iterations: 10,
  scan_exclusions: [".git", "node_modules", "knot/runtime/archive"],
  theme: "dark",
  template_source: "bundled",
  recent_projects: [],
};

beforeEach(() => {
  listenMock.mockResolvedValue(() => undefined);
  invokeMock.mockImplementation((command: string, args?: unknown) => {
    if (command === "get_settings") {
      return Promise.resolve(settingsResponse);
    }

    if (command === "get_template_summary") {
      return Promise.resolve({
        template_path: "/template/knot-template",
        has_core: true,
        has_automation: true,
        has_runtime: true,
        runtime_files: [
          "project-brief.md",
          "project-spec.json",
          "taskboard.json",
          "progress.txt",
        ],
      });
    }

    if (command === "save_settings") {
      return Promise.resolve((args as { settings: unknown }).settings);
    }

    if (command === "detect_ai_clis") {
      return Promise.resolve([
        { name: "claude", available: true, version: "claude 1.0.0", error: null },
        { name: "amp", available: false, version: null, error: "not found" },
      ]);
    }

    if (command === "inspect_project") {
      return Promise.resolve({
        path: "/tmp/content-project",
        name: "content-project",
        has_knot_dir: false,
        has_core: false,
        has_automation: false,
        has_runtime: false,
        runtime_kind: "missing",
        project_id: null,
        story_count: 0,
        progress_entries: 0,
        review_count: 0,
      });
    }

    if (command === "install_knot_template") {
      return Promise.resolve({
        project: {
          path: "/tmp/content-project",
          name: "content-project",
          has_knot_dir: true,
          has_core: true,
          has_automation: true,
          has_runtime: true,
          runtime_kind: "demo",
          project_id: "starter-example",
          story_count: 1,
          progress_entries: 1,
          review_count: 0,
        },
        backup: null,
        copied_files: 24,
      });
    }

    if (command === "scan_project") {
      return Promise.resolve({
        project_path: "/tmp/content-project",
        included_roots: ["script", "assets"],
        excluded_paths: ["node_modules"],
        recognized_files: ["README.md", "config.json"],
        target_files: [
          "knot/runtime/project-brief.md",
          "knot/runtime/project-spec.json",
          "knot/runtime/taskboard.json",
          "knot/runtime/progress.txt",
        ],
      });
    }

    if (command === "generate_runtime_draft") {
      return Promise.resolve({
        cli: "claude",
        exit_code: 0,
        stdout: "{\"project-brief.md\":\"brief\"}",
        stderr: "",
        staging_dir: "/tmp/content-project/knot/runtime/.workbench-staging",
        files: [
          {
            path: "/tmp/content-project/knot/runtime/.workbench-staging/taskboard.json",
            bytes: 42,
          },
        ],
      });
    }

    if (command === "save_runtime_draft") {
      return Promise.resolve({
        ok: true,
        issues: [],
        written_files: [
          "/tmp/content-project/knot/runtime/project-brief.md",
          "/tmp/content-project/knot/runtime/project-spec.json",
          "/tmp/content-project/knot/runtime/taskboard.json",
        ],
        snapshot_dir: null,
      });
    }

    if (command === "remember_project") {
      return Promise.resolve({
        ...settingsResponse,
        recent_projects: [
          { path: "/tmp/content-project", name: "content-project", last_opened: 1 },
        ],
      });
    }

    if (command === "get_app_status") {
      return Promise.resolve({
        product_name: "Knot Workbench",
        phase: "第 10 阶段",
        rust_bridge: true,
      });
    }

    return Promise.reject(new Error(`Unhandled command: ${command}`));
  });
});

afterEach(() => {
  cleanup();
  invokeMock.mockReset();
  openMock.mockReset();
  listenMock.mockReset();
  document.documentElement.removeAttribute("data-theme");
});

describe("App", () => {
  it("renders the product shell", () => {
    render(<App />);

    expect(screen.getAllByText("Knot Workbench")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "总览", level: 1 })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeTruthy();
    expect(screen.getByText("本地运行时工作台")).toBeTruthy();
  });

  it("shows seven Chinese navigation entries", () => {
    render(<App />);

    const nav = screen.getByRole("navigation", { name: "主导航" });
    const entries = [
      "总览",
      "准备项目",
      "运行时",
      "工作流",
      "预检",
      "运行",
      "产物",
    ];

    for (const entry of entries) {
      expect(screen.getByRole("button", { name: entry })).toBeTruthy();
    }

    expect(nav.querySelectorAll("button")).toHaveLength(7);
  });

  it("syncs the main page and inspector when navigating", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "工作流" }));

    expect(screen.getByRole("heading", { name: "编辑内容单元、依赖和门禁", level: 1 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "内容单元检查器" })).toBeTruthy();
  });

  it("switches between dark and light themes", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "浅色" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "浅色" }).className).toContain(
      "is-active",
    );
  });

  it("checks the Rust command bridge", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "检查 Rust 通路" }));

    expect(await screen.findByText("第 10 阶段：已连接")).toBeTruthy();
    expect(invokeMock).toHaveBeenCalledWith("get_app_status");
  });

  it("selects a project folder and shows the detection summary", async () => {
    openMock.mockResolvedValueOnce("/tmp/content-project");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "准备项目" }));
    fireEvent.click(screen.getByRole("button", { name: "打开项目" }));

    expect(await screen.findAllByText("content-project")).toHaveLength(3);
    expect(screen.getAllByText("/tmp/content-project")).toHaveLength(2);
    expect(invokeMock).toHaveBeenCalledWith("inspect_project", {
      path: "/tmp/content-project",
    });
    expect(invokeMock).toHaveBeenCalledWith("remember_project", {
      path: "/tmp/content-project",
    });
  });

  it("copies the bundled Knot template into a plain project", async () => {
    openMock.mockResolvedValueOnce("/tmp/content-project");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "准备项目" }));
    fireEvent.click(screen.getByRole("button", { name: "打开项目" }));
    await screen.findAllByText("content-project");
    fireEvent.click(screen.getByRole("button", { name: "复制 Knot 框架" }));

    expect(await screen.findByText("已复制 24 个模板文件。")).toBeTruthy();
    expect(invokeMock).toHaveBeenCalledWith("install_knot_template", {
      request: {
        project_path: "/tmp/content-project",
        backup_existing_runtime: false,
        allow_production: false,
      },
    });
  });

  it("requires scan confirmation before generating runtime draft", async () => {
    openMock.mockResolvedValueOnce("/tmp/content-project");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "准备项目" }));
    fireEvent.click(screen.getByRole("button", { name: "打开项目" }));
    await screen.findAllByText("content-project");

    fireEvent.click(screen.getByRole("button", { name: "生成扫描摘要" }));
    expect(await screen.findByText("script")).toBeTruthy();
    expect(screen.getByText("knot/runtime/taskboard.json")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "生成运行时草案" }));
    expect(await screen.findByText("运行时草案已写入暂存区，等待审查。")).toBeTruthy();
    expect(screen.getAllByText(/workbench-staging/)).toHaveLength(2);
    expect(invokeMock).toHaveBeenCalledWith("generate_runtime_draft", {
      request: {
        project_path: "/tmp/content-project",
        cli: "claude",
        exclusions: [".git", "node_modules", "knot/runtime/archive"],
      },
    });
  });

  it("loads CLI statuses on startup", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "准备项目" }));

    await waitFor(() => {
      expect(screen.getByText("claude 1.0.0")).toBeTruthy();
    });
    expect(screen.getByText("未找到")).toBeTruthy();
  });
});
