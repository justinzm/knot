import { useState } from "react";
import type { RuntimeWorkspace } from "../../hooks/useRuntimeWorkspace";
import { validateRuntimeDraft } from "../../lib/knot/validation";
import {
  saveRuntimeDraft,
  type RuntimeSaveResult,
  type RuntimeValidationIssue,
} from "../../lib/tauri/commands";
import { FieldError } from "../ui/FieldError";
import { ValidationSummary } from "./ValidationSummary";

interface RuntimeSavePanelProps {
  workspace: RuntimeWorkspace;
  projectPath: string | null;
}

export function RuntimeSavePanel({ workspace, projectPath }: RuntimeSavePanelProps) {
  const [issues, setIssues] = useState<RuntimeValidationIssue[]>([]);
  const [saveResult, setSaveResult] = useState<RuntimeSaveResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const nextIssues = validateRuntimeDraft(
      projectPath,
      workspace.brief,
      workspace.spec,
      workspace.taskboard,
    );
    setIssues(nextIssues);
    setSaveResult(null);
    if (nextIssues.length > 0 || !projectPath) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveRuntimeDraft({
        project_path: projectPath,
        brief: workspace.brief,
        project_spec: workspace.spec,
        taskboard: workspace.taskboard,
      });
      setSaveResult(result);
      setIssues(result.issues);
    } catch (error: unknown) {
      setIssues([
        {
          file: "runtime",
          field: "save",
          story_id: null,
          message: error instanceof Error ? error.message : "保存运行时失败。",
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="runtime-save-panel">
      <button
        type="button"
        className="primary-action"
        onClick={() => void handleSave()}
        disabled={workspace.isRuntimeRunning || isSaving}
      >
        {isSaving ? "保存中" : "校验并保存"}
      </button>
      <FieldError message={projectPath ? null : "请先在“准备项目”选择项目文件夹。"} />
      <ValidationSummary issues={issues} result={saveResult} isSaving={isSaving} />
    </div>
  );
}
