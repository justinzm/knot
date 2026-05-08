import { detectDependencyCycle } from "./graph";
import type { RuntimeValidationIssue } from "../tauri/commands";
import type { ProjectSpec, Taskboard } from "./types";

export function validateRuntimeDraft(
  projectPath: string | null,
  brief: string,
  spec: ProjectSpec,
  taskboard: Taskboard,
): RuntimeValidationIssue[] {
  const issues: RuntimeValidationIssue[] = [];

  if (!projectPath) {
    issues.push(issue("runtime", "project_path", null, "请先在“准备项目”选择项目文件夹。"));
  }
  if (brief.trim().length < 3) {
    issues.push(issue("project-brief.md", "brief", null, "项目简报不能为空。"));
  }
  if (!spec.project_id.trim()) {
    issues.push(issue("project-spec.json", "project_id", null, "项目 ID 不能为空。"));
  }
  if (spec.review_policy.required_gates.length === 0) {
    issues.push(issue("project-spec.json", "required_gates", null, "至少选择一个全局门禁。"));
  }
  if (taskboard.stories.length === 0) {
    issues.push(issue("taskboard.json", "stories", null, "至少需要一个内容单元。"));
  }

  for (const story of taskboard.stories) {
    if (story.outputs.length === 0) {
      issues.push(issue("taskboard.json", "outputs", story.id, "每个内容单元至少需要一个输出。"));
    }
    for (const path of [...story.inputs, ...story.outputs]) {
      if (isUnsafePath(path)) {
        issues.push(issue("taskboard.json", "path", story.id, `路径不能是绝对路径或 ../：${path}`));
      }
    }
    if (story.review_policy.required_gates.length === 0) {
      issues.push(issue("taskboard.json", "required_gates", story.id, "每个内容单元至少需要一个门禁。"));
    }
  }

  const cycle = detectDependencyCycle(taskboard.stories);
  if (cycle.length > 0) {
    issues.push(issue("taskboard.json", "dependencies", cycle[0], `依赖环：${cycle.join(" → ")}`));
  }

  return issues;
}

function isUnsafePath(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:\\/.test(path) || path.split("/").includes("..");
}

function issue(
  file: string,
  field: string,
  storyId: string | null,
  message: string,
): RuntimeValidationIssue {
  return { file, field, story_id: storyId, message };
}
