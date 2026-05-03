import type { Taskboard, ValidationIssue } from "./types";

const drivePathPattern = /^[A-Za-z]:\\/;

export function isLegalRuntimePath(path: string): boolean {
  if (path.startsWith("/")) {
    return false;
  }
  if (path.startsWith("../")) {
    return false;
  }
  if (drivePathPattern.test(path)) {
    return false;
  }
  return path.trim().length > 0;
}

export function validateTaskboardBasics(taskboard: Taskboard): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenStoryIds = new Set<string>();

  taskboard.stories.forEach((story, storyIndex) => {
    if (seenStoryIds.has(story.id)) {
      issues.push({
        path: `stories[${storyIndex}].id`,
        message: `Story id ${story.id} is duplicated.`,
        severity: "error",
      });
    }
    seenStoryIds.add(story.id);

    story.inputs.forEach((input, inputIndex) => {
      if (!isLegalRuntimePath(input)) {
        issues.push({
          path: `stories[${storyIndex}].inputs[${inputIndex}]`,
          message: `Input path ${input} must be project-relative and cannot use parent traversal.`,
          severity: "error",
        });
      }
    });

    story.outputs.forEach((output, outputIndex) => {
      if (!isLegalRuntimePath(output)) {
        issues.push({
          path: `stories[${storyIndex}].outputs[${outputIndex}]`,
          message: `Output path ${output} must be project-relative and cannot use parent traversal.`,
          severity: "error",
        });
      }
    });
  });

  return issues;
}
