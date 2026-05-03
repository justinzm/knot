import { invoke } from "@tauri-apps/api/core";

import type { RuntimeSnapshot } from "./types";

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
