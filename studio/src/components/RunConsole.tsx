import { useState } from "react";

import { normalizeUnknownError } from "../lib/errors";
import { runLoopOnce, runPreflight } from "../lib/knot/tauri";
import type { CommandRunResult, RuntimeSnapshot } from "../lib/knot/types";

interface RunConsoleProps {
  snapshot: RuntimeSnapshot;
}

type Tool = "claude" | "amp";
type RunningCommand = "preflight" | "loop" | null;

export function RunConsole({ snapshot }: RunConsoleProps) {
  const [tool, setTool] = useState<Tool>("claude");
  const [runningCommand, setRunningCommand] = useState<RunningCommand>(null);
  const [result, setResult] = useState<CommandRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = runningCommand !== null;

  async function handleRunPreflight() {
    await runCommand("preflight", () => runPreflight(snapshot.knotRoot));
  }

  async function handleStartLoop() {
    await runCommand("loop", () => runLoopOnce(snapshot.knotRoot, tool, 10));
  }

  async function runCommand(command: Exclude<RunningCommand, null>, runner: () => Promise<CommandRunResult>) {
    setRunningCommand(command);
    setError(null);
    try {
      setResult(await runner());
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setRunningCommand(null);
    }
  }

  return (
    <section className="panel">
      <h2>Run Console</h2>
      <div className="run-controls">
        <label className="field compact">
          <span>AI tool</span>
          <select value={tool} onChange={(event) => setTool(event.target.value as Tool)} disabled={running}>
            <option value="claude">claude</option>
            <option value="amp">amp</option>
          </select>
        </label>
        <button className="primary-button" onClick={handleRunPreflight} disabled={running}>
          {runningCommand === "preflight" ? "Running preflight..." : "Run preflight"}
        </button>
        <button className="primary-button" onClick={handleStartLoop} disabled={running}>
          {runningCommand === "loop" ? "Running loop..." : "Start loop"}
        </button>
      </div>
      <p>
        <strong>Run status:</strong> {running ? `running ${runningCommand}` : "idle"}
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <pre className="log-output">{formatCommandResult(result)}</pre>
    </section>
  );
}

function formatCommandResult(result: CommandRunResult | null): string {
  if (!result) {
    return "No command has run yet.";
  }

  return [
    `status: ${result.status}`,
    `exitCode: ${result.exitCode ?? "null"}`,
    "stdout:",
    result.stdout || "(empty)",
    "stderr:",
    result.stderr || "(empty)",
  ].join("\n");
}
