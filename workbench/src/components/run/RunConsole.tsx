import { processLogText } from "../../lib/knot/runState";
import type { ProcessLogEvent } from "../../lib/tauri/commands";

interface RunConsoleProps {
  title: string;
  logs: ProcessLogEvent[];
  fallback: string;
}

export function RunConsole({ title, logs, fallback }: RunConsoleProps) {
  return (
    <section className="process-panel run-console">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{logs.length} 行</span>
      </div>
      <pre>{processLogText(logs) || fallback}</pre>
    </section>
  );
}
