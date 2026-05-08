import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRuntimeWorkspace } from "../hooks/useRuntimeWorkspace";
import { RuntimeView } from "./RuntimeView";

function RuntimeHarness() {
  const workspace = useRuntimeWorkspace();
  return <RuntimeView workspace={workspace} projectPath={null} />;
}

describe("RuntimeView", () => {
  it("edits project spec fields and locks them while running", () => {
    render(<RuntimeHarness />);

    const projectId = screen.getByLabelText("项目 ID");
    fireEvent.change(projectId, { target: { value: "content-runtime" } });

    expect(screen.getByDisplayValue("content-runtime")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "模拟运行只读" }));
    expect(screen.getByText("运行状态：结构性字段已锁定，只允许查看。")).toBeTruthy();
    expect(screen.getByLabelText("项目 ID")).toHaveProperty("disabled", true);
  });
});
