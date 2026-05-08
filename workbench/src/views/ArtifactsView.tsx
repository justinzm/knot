import { useEffect, useState } from "react";
import { ArtifactTree } from "../components/artifacts/ArtifactTree";
import { FilePreview } from "../components/artifacts/FilePreview";
import { ProgressTimeline } from "../components/artifacts/ProgressTimeline";
import { ReviewSummary } from "../components/artifacts/ReviewSummary";
import type { ArtifactItem, ArtifactTab, ArtifactsSnapshot } from "../lib/knot/artifacts";
import { readArtifacts } from "../lib/tauri/commands";
import "./ArtifactsView.css";

interface ArtifactsViewProps {
  projectPath: string | null;
}

export function ArtifactsView({ projectPath }: ArtifactsViewProps) {
  const [activeTab, setActiveTab] = useState<ArtifactTab>("outputs");
  const [snapshot, setSnapshot] = useState<ArtifactsSnapshot | null>(null);
  const [selected, setSelected] = useState<ArtifactItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projectPath) {
      void refresh();
    }
  }, [projectPath]);

  async function refresh() {
    if (!projectPath) {
      setError("请先在“准备项目”选择项目文件夹。");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const next = await readArtifacts(projectPath);
      setSnapshot(next);
      setSelected(next.outputs[0] ?? next.reviews[0] ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "读取产物失败。");
    } finally {
      setIsLoading(false);
    }
  }

  const outputs = snapshot?.outputs ?? [];
  const reviews = snapshot?.reviews ?? [];

  return (
    <section className="artifacts-view" aria-label="产物">
      <div className="page-header">
        <div>
          <p className="page-kicker">产物</p>
          <h1 className="page-title">浏览产物、审核与进度</h1>
          <p className="page-description">在一个页面查看声明产物、审核结果和进度时间线。</p>
        </div>
        <button type="button" className="primary-action" onClick={() => void refresh()}>
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>

      {!projectPath ? <p className="error-message">请先在“准备项目”选择项目文件夹。</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <div className="artifact-tabs">
        {(["outputs", "reviews", "progress"] as ArtifactTab[]).map((tab) => (
          <button key={tab} type="button" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab === "outputs" ? "产物" : tab === "reviews" ? "审核" : "进度"}
          </button>
        ))}
      </div>

      {activeTab === "progress" ? (
        <ProgressTimeline entries={snapshot?.progress ?? []} />
      ) : (
        <div className="artifacts-grid">
          {activeTab === "outputs" ? (
            <ArtifactTree title="产物文件" items={outputs} selectedPath={selected?.path ?? null} onSelect={setSelected} />
          ) : (
            <>
              <ReviewSummary reviews={reviews} />
              <ArtifactTree title="审核文件" items={reviews} selectedPath={selected?.path ?? null} onSelect={setSelected} />
            </>
          )}
          <FilePreview item={selected} />
        </div>
      )}
    </section>
  );
}
