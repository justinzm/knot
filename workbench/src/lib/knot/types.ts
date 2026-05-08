export const GATE_OPTIONS = [
  "existence",
  "structure",
  "business",
  "compliance",
  "continuity",
  "editorial",
  "brand",
  "custom",
] as const;

export type GateName = (typeof GATE_OPTIONS)[number];

export type StoryStatus =
  | "todo"
  | "ready"
  | "in_progress"
  | "in_review"
  | "needs_revision"
  | "blocked"
  | "done";

export interface ReviewPolicy {
  required_gates: GateName[];
  reviewers?: string[];
  max_revision_rounds?: number;
  blocking?: boolean;
  review_artifacts?: string[];
}

export interface Story {
  id: string;
  title: string;
  stage: string;
  description: string;
  priority: number;
  status: StoryStatus;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  acceptance_criteria: string[];
  review_policy: ReviewPolicy;
  notes: string;
}

export interface Taskboard {
  project: string;
  workflow: string;
  description: string;
  stories: Story[];
}

export interface ProjectSpec {
  project_id: string;
  project_type: string;
  target_medium: string;
  language: string;
  audience: string;
  style: {
    voice: string;
    visual_style: string;
    tone: string;
  };
  workflow: {
    stages: string[];
    artifact_root: string;
    fact_root: string;
    review_root: string;
  };
  review_policy: {
    required_gates: GateName[];
    notes: string;
  };
  naming: {
    story_prefix: string;
    artifact_convention: string;
  };
}

export interface RuntimeDraft {
  brief: string;
  spec: ProjectSpec;
  taskboard: Taskboard;
}
