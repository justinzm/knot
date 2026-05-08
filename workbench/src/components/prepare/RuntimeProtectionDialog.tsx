import type { ProjectSummary } from "../../lib/tauri/commands";
import "./RuntimeProtectionDialog.css";

interface RuntimeProtectionDialogProps {
  project: ProjectSummary;
  isBusy: boolean;
  onBackupReplace: () => void;
  onRefreshInPlace: () => void;
  onChooseAnother: () => void;
}

export function RuntimeProtectionDialog({
  project,
  isBusy,
  onBackupReplace,
  onRefreshInPlace,
  onChooseAnother,
}: RuntimeProtectionDialogProps) {
  return (
    <div className="protection-dialog" role="dialog" aria-modal="true">
      <section>
        <p className="page-kicker">生产运行时保护</p>
        <h2>检测到已有生产运行时</h2>
        <p>
          当前项目包含 {project.story_count} 个内容单元、{project.progress_entries} 条进度记录和{" "}
          {project.review_count} 个审核文件。Knot Workbench 不会默认覆盖这些状态。
        </p>
        <div className="dialog-actions">
          <button type="button" className="primary-action" onClick={onBackupReplace} disabled={isBusy}>
            备份后替换
          </button>
          <button type="button" onClick={onRefreshInPlace} disabled={isBusy}>
            原地刷新
          </button>
          <button type="button" onClick={onChooseAnother}>
            另选目录
          </button>
        </div>
      </section>
    </div>
  );
}
