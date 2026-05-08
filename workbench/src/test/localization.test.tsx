import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationConsole } from "../components/prepare/GenerationConsole";
import { KnotDetectionPanel } from "../components/prepare/KnotDetectionPanel";
import { RuntimeProtectionDialog } from "../components/prepare/RuntimeProtectionDialog";
import { ProjectSpecForm } from "../components/runtime/ProjectSpecForm";
import { RunSummary } from "../components/run/RunSummary";
import type { LoopResult, PreflightResult, ProjectSummary } from "../lib/tauri/commands";
import { createDefaultRuntime } from "../lib/knot/taskboard";

const projectSummary: ProjectSummary = {
  path: "/tmp/project",
  name: "project",
  has_knot_dir: true,
  has_core: true,
  has_automation: true,
  has_runtime: true,
  runtime_kind: "production",
  project_id: "demo-project",
  story_count: 3,
  progress_entries: 5,
  review_count: 2,
};

const preflightResult: PreflightResult = {
  ok: true,
  exit_code: 0,
  stdout: "",
  stderr: "",
  report: null,
  checks: [],
};

const loopResult: LoopResult = {
  status: "completed",
  exit_code: 0,
  stdout: "",
  stderr: "",
  completed: true,
  project: projectSummary,
};

describe("Chinese localization", () => {
  it("renders Chinese labels in detection and protection panels", () => {
    render(
      <>
        <KnotDetectionPanel
          project={projectSummary}
          template={null}
          isBusy={false}
          onInstall={() => undefined}
          onProductionAction={() => undefined}
        />
        <RuntimeProtectionDialog
          project={projectSummary}
          isBusy={false}
          onBackupReplace={() => undefined}
          onRefreshInPlace={() => undefined}
          onChooseAnother={() => undefined}
        />
      </>,
    );

    expect(screen.getByRole("button", { name: "处理已有运行时" })).toBeTruthy();
    expect(screen.getByText("内容单元")).toBeTruthy();
    expect(screen.getByText("审核")).toBeTruthy();
    expect(screen.getByText("项目 ID")).toBeTruthy();
    expect(screen.getByText(/3 个内容单元、5 条进度记录和 2 个审核文件/)).toBeTruthy();
  });

  it("renders Chinese status text in run and generation panels", () => {
    render(
      <>
        <RunSummary preflight={preflightResult} loop={loopResult} />
        <GenerationConsole
          result={{
            cli: "claude",
            exit_code: 0,
            stdout: "",
            stderr: "",
            staging_dir: "/tmp/project/knot/runtime/.workbench-staging",
            files: [{ path: "/tmp/project/taskboard.json", bytes: 42 }],
          }}
          liveLogs={[]}
        />
      </>,
    );

    expect(screen.getByText("已完成")).toBeTruthy();
    expect(screen.getByText("/tmp/project/taskboard.json · 42 字节")).toBeTruthy();
  });

  it("renders Chinese field labels in the project spec form", () => {
    const runtime = createDefaultRuntime();

    render(
      <ProjectSpecForm
        spec={runtime.spec}
        readOnly={false}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText("内容单元前缀")).toBeTruthy();
  });
});
