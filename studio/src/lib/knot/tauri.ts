import { invoke } from "@tauri-apps/api/core";

import type { CommandRunResult, RuntimeSnapshot } from "./types";

export async function openRuntime(projectRoot: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("open_runtime", { projectRoot });
}

export async function saveProjectBrief(
  knotRoot: string,
  contents: string,
): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_project_brief", { knotRoot, contents });
}

export async function saveProjectSpec(knotRoot: string, json: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_project_spec", { knotRoot, json });
}

export async function saveTaskboard(knotRoot: string, json: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_taskboard", { knotRoot, json });
}

export async function runPreflight(knotRoot: string): Promise<CommandRunResult> {
  return invoke<CommandRunResult>("run_preflight", { knotRoot });
}

export async function runLoopOnce(
  knotRoot: string,
  tool: "claude" | "amp",
  maxIterations: number,
): Promise<CommandRunResult> {
  return invoke<CommandRunResult>("run_loop_once", { knotRoot, tool, maxIterations });
}
