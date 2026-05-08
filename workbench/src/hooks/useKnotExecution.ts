import { useState } from "react";
import {
  runPreflight,
  startKnotLoop,
  stopKnotLoop,
  type LoopResult,
  type PreflightResult,
  type ProcessLogEvent,
} from "../lib/tauri/commands";

export function useKnotExecution() {
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
  const [loopResult, setLoopResult] = useState<LoopResult | null>(null);
  const [preflightLogs, setPreflightLogs] = useState<ProcessLogEvent[]>([]);
  const [loopLogs, setLoopLogs] = useState<ProcessLogEvent[]>([]);
  const [isPreflightRunning, setIsPreflightRunning] = useState(false);
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  async function runProjectPreflight(projectPath: string | null) {
    if (!projectPath) {
      setExecutionError("请先选择项目文件夹。");
      return;
    }
    setIsPreflightRunning(true);
    setExecutionError(null);
    setPreflightLogs([]);
    try {
      setPreflightResult(
        await runPreflight(projectPath, (event) =>
          setPreflightLogs((logs) => [...logs, event]),
        ),
      );
    } catch (error: unknown) {
      setExecutionError(error instanceof Error ? error.message : "预检执行失败。");
    } finally {
      setIsPreflightRunning(false);
    }
  }

  async function startProjectLoop(projectPath: string | null, cli: string, maxIterations: number) {
    if (!projectPath) {
      setExecutionError("请先选择项目文件夹。");
      return;
    }
    setIsLoopRunning(true);
    setExecutionError(null);
    setLoopLogs([]);
    setLoopResult(null);
    try {
      setLoopResult(
        await startKnotLoop(
          { project_path: projectPath, cli, max_iterations: maxIterations },
          (event) => setLoopLogs((logs) => [...logs, event]),
        ),
      );
    } catch (error: unknown) {
      setExecutionError(error instanceof Error ? error.message : "Knot 循环执行失败。");
    } finally {
      setIsLoopRunning(false);
    }
  }

  async function stopProjectLoop() {
    try {
      await stopKnotLoop();
    } catch (error: unknown) {
      setExecutionError(error instanceof Error ? error.message : "停止 Knot 循环失败。");
    }
  }

  return {
    preflightResult,
    loopResult,
    preflightLogs,
    loopLogs,
    isPreflightRunning,
    isLoopRunning,
    executionError,
    runProjectPreflight,
    startProjectLoop,
    stopProjectLoop,
  };
}

export type KnotExecutionWorkspace = ReturnType<typeof useKnotExecution>;
