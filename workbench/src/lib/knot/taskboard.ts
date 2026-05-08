import { dependentStoryIds } from "./graph";
import type { GateName, RuntimeDraft, Story, StoryStatus, Taskboard } from "./types";

export const STORY_STATUSES: StoryStatus[] = [
  "todo",
  "ready",
  "in_progress",
  "in_review",
  "needs_revision",
  "blocked",
  "done",
];

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  todo: "待处理",
  ready: "就绪",
  in_progress: "进行中",
  in_review: "审核中",
  needs_revision: "待修订",
  blocked: "阻塞",
  done: "完成",
};

export function createDefaultRuntime(): RuntimeDraft {
  return {
    brief: [
      "# 项目简报",
      "",
      "说明项目目标、输入素材、输出产物、风格约束和审核要求。",
    ].join("\n"),
    spec: {
      project_id: "knot-workbench-draft",
      project_type: "content-production",
      target_medium: "markdown",
      language: "zh-CN",
      audience: "内容制作团队",
      style: {
        voice: "清晰、直接、可执行",
        visual_style: "极简工作台",
        tone: "专业克制",
      },
      workflow: {
        stages: ["brief", "draft", "review"],
        artifact_root: "outputs/",
        fact_root: "assets/",
        review_root: "knot/runtime/reviews/",
      },
      review_policy: {
        required_gates: ["existence", "structure", "business"],
        notes: "每个内容单元都需要完成声明、产物路径和门禁记录。",
      },
      naming: {
        story_prefix: "ST",
        artifact_convention: "outputs/{stage}/{story-id}.md",
      },
    },
    taskboard: {
      project: "Knot Workbench Draft",
      workflow: "produce-validate-review",
      description: "用于工作流编辑器的本地运行时草案。",
      stories: [createStory("ST-001", "梳理项目目标", "brief", [])],
    },
  };
}

export function createStory(
  id: string,
  title: string,
  stage: string,
  dependencies: string[],
): Story {
  return {
    id,
    title,
    stage,
    description: "补充这条内容单元的执行范围、输入依据和完成定义。",
    priority: 1,
    status: "todo",
    inputs: ["runtime/project-brief.md", "runtime/project-spec.json"],
    outputs: [`outputs/${id.toLowerCase()}.md`],
    dependencies,
    acceptance_criteria: ["产物存在且内容结构完整"],
    review_policy: {
      required_gates: ["existence", "structure"],
      reviewers: ["owner"],
      max_revision_rounds: 2,
      blocking: true,
      review_artifacts: [`knot/runtime/reviews/${id.toLowerCase()}.json`],
    },
    notes: "",
  };
}

export function nextStoryId(stories: Story[], prefix: string): string {
  const max = stories.reduce((value, story) => {
    const match = story.id.match(/-(\d+)$/);
    return Math.max(value, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function replaceStory(stories: Story[], nextStory: Story): Story[] {
  return stories.map((story) => (story.id === nextStory.id ? nextStory : story));
}

export function storyStatusCounts(taskboard: Taskboard): Record<StoryStatus, number> {
  return STORY_STATUSES.reduce(
    (counts, status) => ({
      ...counts,
      [status]: taskboard.stories.filter((story) => story.status === status).length,
    }),
    {} as Record<StoryStatus, number>,
  );
}

export function deleteStory(stories: Story[], storyId: string) {
  const dependents = dependentStoryIds(stories, storyId);
  if (dependents.length > 0) {
    return {
      stories,
      error: `无法删除 ${storyId}，仍被 ${dependents.join("、")} 依赖。`,
    };
  }
  return { stories: stories.filter((story) => story.id !== storyId), error: null };
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toggleGate(gates: GateName[], gate: GateName): GateName[] {
  return gates.includes(gate)
    ? gates.filter((item) => item !== gate)
    : [...gates, gate];
}
