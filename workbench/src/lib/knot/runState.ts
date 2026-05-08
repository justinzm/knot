import type { LoopResult, PreflightResult } from "../tauri/commands";

export type RunPhase =
  | "idle"
  | "preflight"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export function preflightPassed(result: PreflightResult | null): boolean {
  return Boolean(result?.ok);
}

export function runPhaseFromLoop(result: LoopResult | null): RunPhase {
  if (!result) {
    return "idle";
  }
  return result.status;
}

export function processLogText(logs: { stream: string; line: string }[]): string {
  return logs.map((log) => `[${log.stream}] ${log.line}`).join("\n");
}
