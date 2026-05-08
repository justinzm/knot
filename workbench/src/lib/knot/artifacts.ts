export type ArtifactTab = "outputs" | "reviews" | "progress";

export interface ArtifactItem {
  kind: string;
  path: string;
  exists: boolean;
  size: number;
  modified: number | null;
  status: "ok" | "missing" | "json_error" | "fail" | string;
  preview: string;
  parse_error: string | null;
}

export interface ProgressEntry {
  title: string;
  kind: string;
  status: string;
  body: string;
}

export interface ArtifactsSnapshot {
  outputs: ArtifactItem[];
  reviews: ArtifactItem[];
  progress: ProgressEntry[];
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ok: "正常",
    missing: "缺失",
    json_error: "JSON 错误",
    fail: "审核失败",
    pass: "通过",
  };
  return labels[status] ?? status;
}
