import type {
  GenerateRuntimeResult,
  RuntimeGenerationLogEvent,
} from "../../lib/tauri/commands";
import { generationLog, generationSucceeded } from "../../lib/knot/generation";
import "./GenerationConsole.css";

interface GenerationConsoleProps {
  result: GenerateRuntimeResult | null;
  liveLogs: RuntimeGenerationLogEvent[];
}

export function GenerationConsole({ result, liveLogs }: GenerationConsoleProps) {
  const succeeded = generationSucceeded(result);
  const liveOutput = liveLogs.map((event) => `[${event.stream}] ${event.line}`).join("\n");
  const output = liveOutput || generationLog(result);

  return (
    <section className="prepare-panel generation-console">
      <h2>生成日志</h2>
      {result ? (
        <>
          <div className="generation-status" data-ok={succeeded}>
            <span>CLI：{result.cli}</span>
            <span>退出码：{result.exit_code}</span>
            <span>{succeeded ? "已写入暂存区" : "生成失败"}</span>
          </div>
          {result.staging_dir ? <p>暂存区：{result.staging_dir}</p> : null}
          {result.files.length > 0 ? (
            <ul>
              {result.files.map((file) => (
                <li key={file.path}>
                  {file.path} · {file.bytes} 字节
                </li>
              ))}
            </ul>
          ) : null}
          <pre>{output || "没有输出"}</pre>
        </>
      ) : (
        <>
          <p>运行时草案生成后会显示 stdout、stderr、生成文件和暂存区路径。</p>
          {liveOutput ? <pre>{liveOutput}</pre> : null}
        </>
      )}
    </section>
  );
}
