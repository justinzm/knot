import { RuntimeSavePanel } from "../components/runtime/RuntimeSavePanel";
import { GateRulesPanel } from "../components/workflow/GateRulesPanel";
import { StoryInspector } from "../components/workflow/StoryInspector";
import { TaskboardTable } from "../components/workflow/TaskboardTable";
import { WorkflowGraph } from "../components/workflow/WorkflowGraph";
import type { RuntimeWorkspace } from "../hooks/useRuntimeWorkspace";
import "./WorkflowView.css";

interface WorkflowViewProps {
  workspace: RuntimeWorkspace;
  projectPath: string | null;
}

export function WorkflowView({ workspace, projectPath }: WorkflowViewProps) {
  return (
    <section className="workflow-view" aria-label="工作流">
      <div className="page-header">
        <div>
          <p className="page-kicker">工作流</p>
          <h1 className="page-title">编辑内容单元、依赖和门禁</h1>
          <p className="page-description">
            依赖修改会即时检测环路；运行只读状态下禁止修改依赖、输出和 required gates。
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={workspace.addStory}
          disabled={workspace.isRuntimeRunning}
        >
          新增内容单元
        </button>
      </div>
      <RuntimeSavePanel workspace={workspace} projectPath={projectPath} />

      {workspace.runtimeMessage ? (
        <p className="error-message">{workspace.runtimeMessage}</p>
      ) : null}
      {workspace.isRuntimeRunning ? (
        <p className="notice-message">运行中只读保护已启用。</p>
      ) : null}

      <div className="workflow-grid">
        <WorkflowGraph
          stages={workspace.spec.workflow.stages}
          stories={workspace.taskboard.stories}
          selectedStoryId={workspace.selectedStoryId}
          onSelect={workspace.setSelectedStoryId}
        />
        <TaskboardTable
          taskboard={workspace.taskboard}
          spec={workspace.spec}
          selectedStoryId={workspace.selectedStoryId}
          readOnly={workspace.isRuntimeRunning}
          onChange={workspace.updateTaskboard}
          onSelect={workspace.setSelectedStoryId}
          onDelete={workspace.removeStory}
        />
        <StoryInspector
          story={workspace.selectedStory}
          stories={workspace.taskboard.stories}
          stages={workspace.spec.workflow.stages}
          readOnly={workspace.isRuntimeRunning}
          onChange={workspace.updateStory}
          onDependenciesChange={workspace.updateStoryDependencies}
        />
        <GateRulesPanel
          story={workspace.selectedStory}
          readOnly={workspace.isRuntimeRunning}
          onChange={workspace.updateStory}
        />
      </div>
    </section>
  );
}
