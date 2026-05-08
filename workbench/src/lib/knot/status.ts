import type { RuntimeKind } from "../tauri/commands";

export type RuntimeStatus =
  | "not_loaded"
  | "missing_knot"
  | "runtime_missing"
  | "empty"
  | "demo"
  | "production"
  | "reviewing"
  | "ready"
  | "running"
  | "failed"
  | "completed";

export const runtimeStatusLabels: Record<RuntimeStatus, string> = {
  not_loaded: "未加载",
  missing_knot: "缺少 Knot",
  runtime_missing: "缺少运行时",
  empty: "空运行时",
  demo: "示例运行时",
  production: "生产运行时",
  reviewing: "审查中",
  ready: "可运行",
  running: "运行中",
  failed: "失败",
  completed: "已完成",
};

export function runtimeKindLabel(kind: RuntimeKind): string {
  switch (kind) {
    case "empty":
      return runtimeStatusLabels.empty;
    case "demo":
      return runtimeStatusLabels.demo;
    case "production":
      return runtimeStatusLabels.production;
    case "missing":
      return runtimeStatusLabels.runtime_missing;
  }
}

export function runtimeKindTone(kind: RuntimeKind): "muted" | "ok" | "warn" {
  if (kind === "production") {
    return "warn";
  }

  if (kind === "empty" || kind === "demo") {
    return "ok";
  }

  return "muted";
}
