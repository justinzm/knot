import type { GenerateRuntimeResult } from "../tauri/commands";

export type GenerationStatus = "idle" | "scanning" | "ready" | "generating" | "staged" | "failed";

export function generationSucceeded(result: GenerateRuntimeResult | null): boolean {
  return Boolean(result && result.exit_code === 0 && result.staging_dir);
}

export function generationLog(result: GenerateRuntimeResult | null): string {
  if (!result) {
    return "等待生成";
  }

  return [result.stdout, result.stderr].filter(Boolean).join("\n\n").trim();
}
