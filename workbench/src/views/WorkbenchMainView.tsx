import type { KnotExecutionWorkspace } from "../hooks/useKnotExecution";
import type { RuntimeWorkspace } from "../hooks/useRuntimeWorkspace";
import type { NavId } from "../lib/navigation";
import type { AppSettings, WorkbenchStatus } from "../lib/tauri/commands";
import { ArtifactsView } from "./ArtifactsView";
import { OverviewView } from "./OverviewView";
import { PreflightView } from "./PreflightView";
import { RunView } from "./RunView";
import { RuntimeView } from "./RuntimeView";
import { WorkflowView } from "./WorkflowView";

interface WorkbenchMainViewProps {
  activeId: NavId;
  projectPath: string | null;
  settings: AppSettings;
  status: WorkbenchStatus | null;
  isBusy: boolean;
  error: string | null;
  runtime: RuntimeWorkspace;
  execution: KnotExecutionWorkspace;
  onCheckRust: () => void;
  onNavigate: (id: NavId) => void;
}

export function WorkbenchMainView({
  activeId,
  projectPath,
  settings,
  status,
  isBusy,
  error,
  runtime,
  execution,
  onCheckRust,
  onNavigate,
}: WorkbenchMainViewProps) {
  if (activeId === "runtime") {
    return <RuntimeView workspace={runtime} projectPath={projectPath} />;
  }
  if (activeId === "workflow") {
    return <WorkflowView workspace={runtime} projectPath={projectPath} />;
  }
  if (activeId === "preflight") {
    return (
      <PreflightView
        projectPath={projectPath}
        execution={execution}
        onOpenRuntime={() => onNavigate("runtime")}
      />
    );
  }
  if (activeId === "run") {
    return <RunView projectPath={projectPath} settings={settings} execution={execution} />;
  }
  if (activeId === "artifacts") {
    return <ArtifactsView projectPath={projectPath} />;
  }

  return (
    <OverviewView
      status={status}
      isBusy={isBusy}
      error={error}
      onCheckRust={onCheckRust}
    />
  );
}
