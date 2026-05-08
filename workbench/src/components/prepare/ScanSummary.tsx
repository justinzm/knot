import type { ProjectScanSummary } from "../../lib/tauri/commands";
import "./ScanSummary.css";

interface ScanSummaryProps {
  scan: ProjectScanSummary | null;
  scanDisabled: boolean;
  generateDisabled: boolean;
  onScan: () => void;
  onGenerate: () => void;
}

export function ScanSummary({
  scan,
  scanDisabled,
  generateDisabled,
  onScan,
  onGenerate,
}: ScanSummaryProps) {
  return (
    <section className="prepare-panel scan-summary">
      <div className="panel-heading">
        <h2>扫描确认</h2>
        <button type="button" onClick={onScan} disabled={scanDisabled}>
          生成扫描摘要
        </button>
      </div>
      {scan ? (
        <div className="scan-grid">
          <ScanList title="扫描目录" items={scan.included_roots} empty="没有可扫描目录" />
          <ScanList title="排除目录" items={scan.excluded_paths} empty="没有命中排除规则" />
          <ScanList title="识别文件" items={scan.recognized_files} empty="没有识别到说明文件" />
          <ScanList title="生成目标" items={scan.target_files} empty="没有生成目标" />
          <button
            type="button"
            className="primary-action"
            onClick={onGenerate}
            disabled={generateDisabled}
          >
            生成运行时草案
          </button>
        </div>
      ) : (
        <p>先生成扫描摘要，确认范围后再调用 AI CLI。</p>
      )}
    </section>
  );
}

function ScanList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul>
          {items.slice(0, 8).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
