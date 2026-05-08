import { ProjectBriefEditor } from "../components/runtime/ProjectBriefEditor";
import { ProjectSpecForm } from "../components/runtime/ProjectSpecForm";
import { RuntimeSavePanel } from "../components/runtime/RuntimeSavePanel";
import { storyStatusCounts } from "../lib/knot/taskboard";
import type { RuntimeWorkspace } from "../hooks/useRuntimeWorkspace";
import "./RuntimeView.css";

interface RuntimeViewProps {
  workspace: RuntimeWorkspace;
  projectPath: string | null;
}

export function RuntimeView({ workspace, projectPath }: RuntimeViewProps) {
  const counts = storyStatusCounts(workspace.taskboard);

  return (
    <section className="runtime-view" aria-label="运行时">
      <div className="page-header">
        <div>
          <p className="page-kicker">运行时</p>
          <h1 className="page-title">审查运行时草案</h1>
          <p className="page-description">
            编辑项目简报和项目规格。保存、schema 校验和原子写入会在 Phase 7 接入。
          </p>
        </div>
        <RuntimeSavePanel workspace={workspace} projectPath={projectPath} />
      </div>

      <button
        type="button"
        className="secondary-action"
        onClick={() => workspace.setIsRuntimeRunning(!workspace.isRuntimeRunning)}
      >
        {workspace.isRuntimeRunning ? "退出只读" : "模拟运行只读"}
      </button>
      {workspace.isRuntimeRunning ? (
        <p className="notice-message">运行状态：结构性字段已锁定，只允许查看。</p>
      ) : null}

      <div className="runtime-summary">
        <span>项目：{workspace.taskboard.project}</span>
        <span>流程：{workspace.taskboard.workflow}</span>
        <span>待处理：{counts.todo}</span>
        <span>完成：{counts.done}</span>
      </div>

      <div className="runtime-grid">
        <ProjectBriefEditor
          brief={workspace.brief}
          readOnly={workspace.isRuntimeRunning}
          onChange={workspace.updateBrief}
        />
        <ProjectSpecForm
          spec={workspace.spec}
          readOnly={workspace.isRuntimeRunning}
          onChange={workspace.updateSpec}
        />
      </div>
    </section>
  );
}
