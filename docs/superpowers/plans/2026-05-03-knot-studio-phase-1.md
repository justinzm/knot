# Knot Studio Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 local desktop MVP for Knot Studio: a Tauri + React application that opens a Knot project, edits runtime files visually, validates them, runs preflight, starts/stops the Knot loop, and displays outputs, reviews, and progress.

**Architecture:** Add a new `studio/` desktop app beside the existing `knot/` framework. React owns the UI and typed client state; Tauri commands own filesystem/process access; the existing Knot runtime files remain the source of truth. All structured saves pass through validation before atomic writes.

**Tech Stack:** Tauri 2, Rust, React, TypeScript, Vite, Vitest, Python `unittest` for existing Knot scripts.

---

## File Structure

Create a new `studio/` directory. Keep the existing Knot framework untouched except for optional docs updates after implementation.

```text
studio/
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── GateRules.tsx
│   │   ├── OutputsBrowser.tsx
│   │   ├── ProjectBrief.tsx
│   │   ├── ProjectSpecView.tsx
│   │   ├── RunConsole.tsx
│   │   ├── Settings.tsx
│   │   ├── StoryInspector.tsx
│   │   ├── TaskboardView.tsx
│   │   ├── ValidationCenter.tsx
│   │   └── WorkflowBuilder.tsx
│   ├── lib/
│   │   └── knot/
│   │       ├── graph.ts
│   │       ├── tauri.ts
│   │       ├── types.ts
│   │       └── validation.ts
│   └── test/
│       ├── graph.test.ts
│       └── validation.test.ts
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── src/
    │   ├── commands.rs
    │   ├── lib.rs
    │   ├── main.rs
    │   ├── process.rs
    │   └── runtime.rs
    └── tests/
        └── runtime_adapter.rs
```

Responsibilities:

- `studio/src/lib/knot/types.ts`: TypeScript interfaces matching current Knot schemas.
- `studio/src/lib/knot/graph.ts`: taskboard-to-graph conversion, graph-to-taskboard conversion, dependency cycle detection.
- `studio/src/lib/knot/validation.ts`: client-side validation helpers that complement backend schema validation.
- `studio/src/lib/knot/tauri.ts`: typed wrapper around Tauri `invoke`.
- `studio/src/components/*`: focused UI sections.
- `studio/src-tauri/src/runtime.rs`: Rust runtime file adapter and atomic writes.
- `studio/src-tauri/src/process.rs`: preflight and loop process execution.
- `studio/src-tauri/src/commands.rs`: Tauri command boundary.

## Task 1: Scaffold Tauri + React App

**Files:**
- Create: `studio/package.json`
- Create: `studio/index.html`
- Create: `studio/vite.config.ts`
- Create: `studio/tsconfig.json`
- Create: `studio/tsconfig.node.json`
- Create: `studio/src/main.tsx`
- Create: `studio/src/App.tsx`
- Create: `studio/src/styles.css`
- Create: `studio/src-tauri/Cargo.toml`
- Create: `studio/src-tauri/tauri.conf.json`
- Create: `studio/src-tauri/src/main.rs`
- Create: `studio/src-tauri/src/lib.rs`

- [ ] **Step 1: Create frontend package metadata**

Create `studio/package.json`:

```json
{
  "name": "knot-studio",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.6.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Add Vite and TypeScript config**

Create `studio/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    strictPort: true,
    port: 1420,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

Create `studio/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `studio/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Add minimal React shell**

Create `studio/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Knot Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `studio/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `studio/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Knot Studio</h1>
        <nav>
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Workflow Builder</button>
          <button className="nav-item">Run Console</button>
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span>No project selected</span>
          <span className="status-pill">idle</span>
        </header>
        <div className="empty-state">
          <h2>Open a Knot project to begin</h2>
          <p>Select a local project folder that contains or should contain a Knot runtime.</p>
        </div>
      </section>
    </main>
  );
}
```

Create `studio/src/styles.css`:

```css
:root {
  color: #172033;
  background: #f3f5f8;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button {
  font: inherit;
}

.app-frame {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #d9dee8;
  background: #ffffff;
  padding: 20px;
}

.sidebar h1 {
  font-size: 20px;
  margin: 0 0 24px;
}

.sidebar nav {
  display: grid;
  gap: 8px;
}

.nav-item {
  border: 0;
  border-radius: 6px;
  background: transparent;
  padding: 10px 12px;
  text-align: left;
  color: #4d5a6f;
}

.nav-item.active {
  background: #e8eef8;
  color: #172033;
}

.workspace {
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #d9dee8;
  background: #ffffff;
  padding: 14px 20px;
}

.status-pill {
  border-radius: 999px;
  background: #eef2f7;
  padding: 4px 10px;
  font-size: 13px;
}

.empty-state {
  margin: 40px;
  max-width: 560px;
}
```

- [ ] **Step 4: Add Tauri shell files**

Create `studio/src-tauri/Cargo.toml`:

```toml
[package]
name = "knot-studio"
version = "0.1.0"
description = "Local desktop workflow builder for Knot"
authors = ["Knot Studio"]
edition = "2021"

[lib]
name = "knot_studio_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
thiserror = "2"
```

Create `studio/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Knot Studio",
  "version": "0.1.0",
  "identifier": "studio.knot.local",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Knot Studio",
        "width": 1280,
        "height": 820,
        "minWidth": 980,
        "minHeight": 680
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

Create `studio/src-tauri/src/main.rs`:

```rust
fn main() {
    knot_studio_lib::run();
}
```

Create `studio/src-tauri/src/lib.rs`:

```rust
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
```

- [ ] **Step 5: Install dependencies and verify build**

Run:

```bash
cd studio
npm install
npm run build
cd src-tauri
cargo check
```

Expected:

- `npm install` completes.
- `npm run build` exits 0.
- `cargo check` exits 0.

- [ ] **Step 6: Commit**

```bash
git add studio
git commit -m "feat: scaffold Knot Studio desktop app"
```

## Task 2: Add TypeScript Runtime Types and Client Validation

**Files:**
- Create: `studio/src/lib/knot/types.ts`
- Create: `studio/src/lib/knot/validation.ts`
- Create: `studio/src/test/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `studio/src/test/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateTaskboardBasics } from "../lib/knot/validation";
import type { Taskboard } from "../lib/knot/types";

const validTaskboard: Taskboard = {
  project: "demo",
  workflow: "content-production",
  description: "Demo content workflow",
  stories: [
    {
      id: "ST-001",
      title: "Create outline",
      stage: "outline",
      description: "Create the first outline artifact.",
      priority: 1,
      status: "ready",
      inputs: ["runtime/project-brief.md"],
      outputs: ["outputs/outline.md"],
      dependencies: [],
      acceptance_criteria: ["Outline exists"],
      review_policy: {
        required_gates: ["existence", "structure"],
        blocking: true,
      },
      notes: "",
    },
  ],
};

describe("validateTaskboardBasics", () => {
  it("accepts a minimal valid taskboard", () => {
    expect(validateTaskboardBasics(validTaskboard)).toEqual([]);
  });

  it("rejects duplicate story ids", () => {
    const duplicate = {
      ...validTaskboard,
      stories: [validTaskboard.stories[0], { ...validTaskboard.stories[0] }],
    };

    expect(validateTaskboardBasics(duplicate)).toContainEqual({
      path: "stories[1].id",
      message: "Story id ST-001 is duplicated.",
      severity: "error",
    });
  });

  it("rejects absolute and parent traversal paths", () => {
    const invalid = {
      ...validTaskboard,
      stories: [
        {
          ...validTaskboard.stories[0],
          inputs: ["/tmp/input.md", "../secret.md"],
        },
      ],
    };

    expect(validateTaskboardBasics(invalid).map((issue) => issue.path)).toEqual([
      "stories[0].inputs[0]",
      "stories[0].inputs[1]",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd studio
npm run test -- --run src/test/validation.test.ts
```

Expected: FAIL because `types.ts` and `validation.ts` do not exist.

- [ ] **Step 3: Add TypeScript schema-aligned types**

Create `studio/src/lib/knot/types.ts`:

```ts
export type StoryStatus =
  | "todo"
  | "ready"
  | "in_progress"
  | "in_review"
  | "needs_revision"
  | "blocked"
  | "done";

export type GateName =
  | "existence"
  | "structure"
  | "business"
  | "compliance"
  | "continuity"
  | "editorial"
  | "brand"
  | "custom";

export interface ReviewPolicy {
  required_gates: GateName[];
  reviewers?: string[];
  max_revision_rounds?: number;
  blocking?: boolean;
  review_artifacts?: string[];
}

export interface Story {
  id: string;
  title: string;
  stage: string;
  description: string;
  priority: number;
  status: StoryStatus;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  acceptance_criteria: string[];
  review_policy: ReviewPolicy;
  notes: string;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface Taskboard {
  project: string;
  workflow: string;
  description: string;
  stories: Story[];
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface ProjectSpec {
  project_id: string;
  project_type: string;
  target_medium: string;
  language: string;
  audience: string;
  style: {
    voice: string;
    visual_style: string;
    tone: string;
  };
  workflow: {
    stages: string[];
    artifact_root: string;
    fact_root: string;
    review_root: string;
  };
  review_policy: {
    required_gates: GateName[];
    notes: string;
  };
  naming: {
    story_prefix: string;
    artifact_convention: string;
  };
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface RuntimeSnapshot {
  projectRoot: string;
  knotRoot: string;
  projectBrief: string;
  projectSpec: ProjectSpec | null;
  taskboard: Taskboard | null;
  progressText: string;
  validationIssues: ValidationIssue[];
}
```

- [ ] **Step 4: Add basic client validation**

Create `studio/src/lib/knot/validation.ts`:

```ts
import type { Taskboard, ValidationIssue } from "./types";

const drivePathPattern = /^[A-Za-z]:\\/;

export function isLegalRuntimePath(path: string): boolean {
  if (path.startsWith("/")) {
    return false;
  }
  if (path.startsWith("../")) {
    return false;
  }
  if (drivePathPattern.test(path)) {
    return false;
  }
  return path.trim().length > 0;
}

export function validateTaskboardBasics(taskboard: Taskboard): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenStoryIds = new Set<string>();

  taskboard.stories.forEach((story, storyIndex) => {
    if (seenStoryIds.has(story.id)) {
      issues.push({
        path: `stories[${storyIndex}].id`,
        message: `Story id ${story.id} is duplicated.`,
        severity: "error",
      });
    }
    seenStoryIds.add(story.id);

    story.inputs.forEach((input, inputIndex) => {
      if (!isLegalRuntimePath(input)) {
        issues.push({
          path: `stories[${storyIndex}].inputs[${inputIndex}]`,
          message: `Input path ${input} must be project-relative and cannot use parent traversal.`,
          severity: "error",
        });
      }
    });

    story.outputs.forEach((output, outputIndex) => {
      if (!isLegalRuntimePath(output)) {
        issues.push({
          path: `stories[${storyIndex}].outputs[${outputIndex}]`,
          message: `Output path ${output} must be project-relative and cannot use parent traversal.`,
          severity: "error",
        });
      }
    });
  });

  return issues;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd studio
npm run test -- --run src/test/validation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add studio/src/lib/knot studio/src/test/validation.test.ts
git commit -m "feat: add Knot runtime types and validation"
```

## Task 3: Add Workflow Graph Conversion and Cycle Detection

**Files:**
- Create: `studio/src/lib/knot/graph.ts`
- Create: `studio/src/test/graph.test.ts`

- [ ] **Step 1: Write failing graph tests**

Create `studio/src/test/graph.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { detectDependencyCycles, taskboardToGraph } from "../lib/knot/graph";
import type { Taskboard } from "../lib/knot/types";

const taskboard: Taskboard = {
  project: "demo",
  workflow: "content",
  description: "Demo",
  stories: [
    {
      id: "ST-001",
      title: "Outline",
      stage: "outline",
      description: "Create outline",
      priority: 1,
      status: "ready",
      inputs: ["runtime/project-brief.md"],
      outputs: ["outputs/outline.md"],
      dependencies: [],
      acceptance_criteria: ["Exists"],
      review_policy: { required_gates: ["existence"] },
      notes: "",
    },
    {
      id: "ST-002",
      title: "Draft",
      stage: "draft",
      description: "Create draft",
      priority: 2,
      status: "todo",
      inputs: ["outputs/outline.md"],
      outputs: ["outputs/draft.md"],
      dependencies: ["ST-001"],
      acceptance_criteria: ["Exists"],
      review_policy: { required_gates: ["existence"] },
      notes: "",
    },
  ],
};

describe("taskboardToGraph", () => {
  it("converts stories to nodes and dependencies to edges", () => {
    expect(taskboardToGraph(taskboard)).toEqual({
      nodes: [
        { id: "ST-001", label: "Outline", stage: "outline", status: "ready" },
        { id: "ST-002", label: "Draft", stage: "draft", status: "todo" },
      ],
      edges: [{ from: "ST-001", to: "ST-002" }],
    });
  });
});

describe("detectDependencyCycles", () => {
  it("returns no cycles for an acyclic board", () => {
    expect(detectDependencyCycles(taskboard)).toEqual([]);
  });

  it("returns cycle path for circular dependencies", () => {
    const cyclic: Taskboard = {
      ...taskboard,
      stories: [
        { ...taskboard.stories[0], dependencies: ["ST-002"] },
        { ...taskboard.stories[1], dependencies: ["ST-001"] },
      ],
    };

    expect(detectDependencyCycles(cyclic)).toEqual([["ST-001", "ST-002", "ST-001"]]);
  });
});
```

- [ ] **Step 2: Run graph test to verify it fails**

Run:

```bash
cd studio
npm run test -- --run src/test/graph.test.ts
```

Expected: FAIL because `graph.ts` does not exist.

- [ ] **Step 3: Implement graph helpers**

Create `studio/src/lib/knot/graph.ts`:

```ts
import type { StoryStatus, Taskboard } from "./types";

export interface WorkflowNode {
  id: string;
  label: string;
  stage: string;
  status: StoryStatus;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function taskboardToGraph(taskboard: Taskboard): WorkflowGraph {
  return {
    nodes: taskboard.stories.map((story) => ({
      id: story.id,
      label: story.title,
      stage: story.stage,
      status: story.status,
    })),
    edges: taskboard.stories.flatMap((story) =>
      story.dependencies.map((dependency) => ({
        from: dependency,
        to: story.id,
      })),
    ),
  };
}

export function detectDependencyCycles(taskboard: Taskboard): string[][] {
  const dependenciesByStory = new Map<string, string[]>();
  taskboard.stories.forEach((story) => dependenciesByStory.set(story.id, story.dependencies));

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const active = new Set<string>();

  function visit(storyId: string, path: string[]): void {
    if (active.has(storyId)) {
      const cycleStart = path.indexOf(storyId);
      cycles.push([...path.slice(cycleStart), storyId]);
      return;
    }
    if (visited.has(storyId)) {
      return;
    }

    visited.add(storyId);
    active.add(storyId);
    const dependencies = dependenciesByStory.get(storyId) ?? [];
    dependencies.forEach((dependency) => visit(dependency, [...path, storyId]));
    active.delete(storyId);
  }

  taskboard.stories.forEach((story) => visit(story.id, []));
  return cycles;
}
```

- [ ] **Step 4: Run graph tests**

Run:

```bash
cd studio
npm run test -- --run src/test/graph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio/src/lib/knot/graph.ts studio/src/test/graph.test.ts
git commit -m "feat: add workflow graph helpers"
```

## Task 4: Add Rust Runtime Adapter

**Files:**
- Create: `studio/src-tauri/src/runtime.rs`
- Modify: `studio/src-tauri/src/lib.rs`
- Create: `studio/src-tauri/tests/runtime_adapter.rs`

- [ ] **Step 1: Write failing Rust adapter tests**

Create `studio/src-tauri/tests/runtime_adapter.rs`:

```rust
use std::fs;

use knot_studio_lib::runtime::{discover_runtime, read_runtime_snapshot, write_atomic};

#[test]
fn discover_runtime_finds_nested_knot_dir() {
    let temp = tempfile::tempdir().expect("temp dir");
    let project = temp.path();
    fs::create_dir_all(project.join("knot/runtime")).expect("create runtime");
    fs::create_dir_all(project.join("knot/automation/schemas")).expect("create schemas");
    fs::create_dir_all(project.join("knot/core")).expect("create core");

    let runtime = discover_runtime(project).expect("runtime");

    assert_eq!(runtime.project_root, project);
    assert_eq!(runtime.knot_root, project.join("knot"));
}

#[test]
fn write_atomic_replaces_file_contents() {
    let temp = tempfile::tempdir().expect("temp dir");
    let file = temp.path().join("runtime/taskboard.json");

    write_atomic(&file, "first").expect("first write");
    write_atomic(&file, "second").expect("second write");

    assert_eq!(fs::read_to_string(file).expect("read file"), "second");
}

#[test]
fn read_runtime_snapshot_reads_known_files() {
    let temp = tempfile::tempdir().expect("temp dir");
    let knot = temp.path().join("knot");
    fs::create_dir_all(knot.join("runtime")).expect("runtime");
    fs::create_dir_all(knot.join("automation/schemas")).expect("schemas");
    fs::create_dir_all(knot.join("core")).expect("core");
    fs::write(knot.join("runtime/project-brief.md"), "# Brief").expect("brief");
    fs::write(knot.join("runtime/project-spec.json"), "{\"project_id\":\"demo\"}").expect("spec");
    fs::write(knot.join("runtime/taskboard.json"), "{\"project\":\"demo\"}").expect("taskboard");
    fs::write(knot.join("runtime/progress.txt"), "# Progress").expect("progress");

    let snapshot = read_runtime_snapshot(&knot).expect("snapshot");

    assert_eq!(snapshot.project_brief, "# Brief");
    assert_eq!(snapshot.progress_text, "# Progress");
    assert!(snapshot.project_spec_json.contains("demo"));
    assert!(snapshot.taskboard_json.contains("demo"));
}
```

- [ ] **Step 2: Add test dependency**

Modify `studio/src-tauri/Cargo.toml` to add:

```toml
[dev-dependencies]
tempfile = "3"
```

- [ ] **Step 3: Run Rust test to verify it fails**

Run:

```bash
cd studio/src-tauri
cargo test --test runtime_adapter
```

Expected: FAIL because `runtime.rs` and exported module do not exist.

- [ ] **Step 4: Implement runtime adapter**

Create `studio/src-tauri/src/runtime.rs`:

```rust
use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("Knot root not found under {0}")]
    KnotRootNotFound(String),
    #[error("file operation failed: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeLocation {
    pub project_root: PathBuf,
    pub knot_root: PathBuf,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSnapshot {
    pub knot_root: PathBuf,
    pub project_brief: String,
    pub project_spec_json: String,
    pub taskboard_json: String,
    pub progress_text: String,
}

pub fn discover_runtime(project_root: &Path) -> Result<RuntimeLocation, RuntimeError> {
    let direct = project_root;
    if is_knot_root(direct) {
        return Ok(RuntimeLocation {
            project_root: project_root.to_path_buf(),
            knot_root: direct.to_path_buf(),
        });
    }

    let nested = project_root.join("knot");
    if is_knot_root(&nested) {
        return Ok(RuntimeLocation {
            project_root: project_root.to_path_buf(),
            knot_root: nested,
        });
    }

    Err(RuntimeError::KnotRootNotFound(project_root.display().to_string()))
}

pub fn read_runtime_snapshot(knot_root: &Path) -> Result<RuntimeSnapshot, RuntimeError> {
    let runtime = knot_root.join("runtime");
    Ok(RuntimeSnapshot {
        knot_root: knot_root.to_path_buf(),
        project_brief: read_optional(runtime.join("project-brief.md"))?,
        project_spec_json: read_optional(runtime.join("project-spec.json"))?,
        taskboard_json: read_optional(runtime.join("taskboard.json"))?,
        progress_text: read_optional(runtime.join("progress.txt"))?,
    })
}

pub fn write_atomic(path: &Path, contents: &str) -> Result<(), RuntimeError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let temp_path = path.with_extension("tmp");
    {
        let mut file = fs::File::create(&temp_path)?;
        file.write_all(contents.as_bytes())?;
        file.sync_all()?;
    }
    fs::rename(temp_path, path)?;
    Ok(())
}

fn is_knot_root(path: &Path) -> bool {
    path.join("runtime").is_dir()
        && path.join("automation").join("schemas").is_dir()
        && path.join("core").is_dir()
}

fn read_optional(path: PathBuf) -> Result<String, RuntimeError> {
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok(String::new())
    }
}
```

Modify `studio/src-tauri/src/lib.rs`:

```rust
pub mod runtime;

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
```

- [ ] **Step 5: Run Rust adapter tests**

Run:

```bash
cd studio/src-tauri
cargo test --test runtime_adapter
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add studio/src-tauri
git commit -m "feat: add Knot runtime file adapter"
```

## Task 5: Add Tauri Commands and Typed Frontend Wrapper

**Files:**
- Create: `studio/src-tauri/src/commands.rs`
- Modify: `studio/src-tauri/src/lib.rs`
- Create: `studio/src/lib/knot/tauri.ts`
- Modify: `studio/src/lib/knot/types.ts`

- [ ] **Step 1: Add frontend command wrapper**

Create `studio/src/lib/knot/tauri.ts`:

```ts
import { invoke } from "@tauri-apps/api/core";
import type { RuntimeSnapshot } from "./types";

export async function openRuntime(projectRoot: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("open_runtime", { projectRoot });
}

export async function saveProjectBrief(knotRoot: string, contents: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_project_brief", { knotRoot, contents });
}

export async function saveProjectSpec(knotRoot: string, json: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_project_spec", { knotRoot, json });
}

export async function saveTaskboard(knotRoot: string, json: string): Promise<RuntimeSnapshot> {
  return invoke<RuntimeSnapshot>("save_taskboard", { knotRoot, json });
}
```

Modify `studio/src/lib/knot/types.ts` so `RuntimeSnapshot` matches Rust command output:

```ts
export interface RuntimeSnapshot {
  knotRoot: string;
  projectBrief: string;
  projectSpecJson: string;
  taskboardJson: string;
  progressText: string;
}
```

- [ ] **Step 2: Add Tauri command implementations**

Create `studio/src-tauri/src/commands.rs`:

```rust
use std::path::PathBuf;

use crate::runtime::{discover_runtime, read_runtime_snapshot, write_atomic, RuntimeSnapshot};

#[tauri::command]
pub fn open_runtime(project_root: String) -> Result<RuntimeSnapshot, String> {
    let location = discover_runtime(&PathBuf::from(project_root)).map_err(|error| error.to_string())?;
    read_runtime_snapshot(&location.knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_brief(knot_root: String, contents: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    write_atomic(&knot_root.join("runtime/project-brief.md"), &contents).map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_spec(knot_root: String, json: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    write_atomic(&knot_root.join("runtime/project-spec.json"), &json).map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_taskboard(knot_root: String, json: String) -> Result<RuntimeSnapshot, String> {
    let knot_root = PathBuf::from(knot_root);
    write_atomic(&knot_root.join("runtime/taskboard.json"), &json).map_err(|error| error.to_string())?;
    read_runtime_snapshot(&knot_root).map_err(|error| error.to_string())
}
```

Modify `studio/src-tauri/src/lib.rs`:

```rust
pub mod commands;
pub mod runtime;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::open_runtime,
            commands::save_project_brief,
            commands::save_project_spec,
            commands::save_taskboard
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
```

- [ ] **Step 3: Verify frontend and Rust compile**

Run:

```bash
cd studio
npm run build
cd src-tauri
cargo check
```

Expected:

- TypeScript build exits 0.
- `cargo check` exits 0.

- [ ] **Step 4: Commit**

```bash
git add studio/src/lib/knot/tauri.ts studio/src/lib/knot/types.ts studio/src-tauri/src
git commit -m "feat: expose runtime commands to frontend"
```

## Task 6: Build App Shell and Runtime Loading UI

**Files:**
- Create: `studio/src/components/AppShell.tsx`
- Create: `studio/src/components/Settings.tsx`
- Modify: `studio/src/App.tsx`
- Modify: `studio/src/styles.css`

- [ ] **Step 1: Create AppShell component**

Create `studio/src/components/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";

export type SectionId =
  | "overview"
  | "brief"
  | "spec"
  | "workflow"
  | "taskboard"
  | "gates"
  | "validation"
  | "run"
  | "outputs"
  | "settings";

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "brief", label: "Project Brief" },
  { id: "spec", label: "Project Spec" },
  { id: "workflow", label: "Workflow Builder" },
  { id: "taskboard", label: "Taskboard" },
  { id: "gates", label: "Gate Rules" },
  { id: "validation", label: "Validation Center" },
  { id: "run", label: "Run Console" },
  { id: "outputs", label: "Outputs" },
  { id: "settings", label: "Settings" },
];

interface AppShellProps {
  activeSection: SectionId;
  knotRoot: string | null;
  status: string;
  onSectionChange: (section: SectionId) => void;
  children: ReactNode;
}

export function AppShell({ activeSection, knotRoot, status, onSectionChange, children }: AppShellProps) {
  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Knot Studio</h1>
        <nav>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span>{knotRoot ?? "No project selected"}</span>
          <span className="status-pill">{status}</span>
        </header>
        {children}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add Settings runtime loader**

Create `studio/src/components/Settings.tsx`:

```tsx
import { useState } from "react";
import { openRuntime } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface SettingsProps {
  onRuntimeLoaded: (snapshot: RuntimeSnapshot) => void;
}

export function Settings({ onRuntimeLoaded }: SettingsProps) {
  const [projectRoot, setProjectRoot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenRuntime() {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await openRuntime(projectRoot);
      onRuntimeLoaded(snapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Open Local Knot Project</h2>
      <label className="field">
        <span>Project folder path</span>
        <input
          value={projectRoot}
          onChange={(event) => setProjectRoot(event.target.value)}
          placeholder="/Users/example/my-content-project"
        />
      </label>
      <button className="primary-button" disabled={!projectRoot || loading} onClick={handleOpenRuntime}>
        {loading ? "Opening..." : "Open runtime"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
```

- [ ] **Step 3: Wire App state**

Modify `studio/src/App.tsx`:

```tsx
import { useState } from "react";
import { AppShell, type SectionId } from "./components/AppShell";
import { Settings } from "./components/Settings";
import type { RuntimeSnapshot } from "./lib/knot/types";

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("settings");
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);

  function handleRuntimeLoaded(nextSnapshot: RuntimeSnapshot) {
    setSnapshot(nextSnapshot);
    setActiveSection("overview");
  }

  return (
    <AppShell
      activeSection={activeSection}
      knotRoot={snapshot?.knotRoot ?? null}
      status={snapshot ? "runtime loaded" : "idle"}
      onSectionChange={setActiveSection}
    >
      {activeSection === "settings" ? (
        <Settings onRuntimeLoaded={handleRuntimeLoaded} />
      ) : (
        <section className="panel">
          <h2>{activeSection}</h2>
          <p>{snapshot ? "Runtime is loaded." : "Open a runtime from Settings."}</p>
        </section>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 4: Add form styles**

Append to `studio/src/styles.css`:

```css
.panel {
  margin: 24px;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 20px;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
  max-width: 620px;
}

.field span {
  color: #4d5a6f;
  font-size: 13px;
}

.field input,
.field textarea,
.field select {
  border: 1px solid #cbd3df;
  border-radius: 6px;
  padding: 10px 12px;
}

.primary-button {
  border: 0;
  border-radius: 6px;
  background: #2457c5;
  color: #ffffff;
  padding: 10px 14px;
}

.primary-button:disabled {
  background: #aeb8c8;
}

.error-text {
  color: #b42318;
}
```

- [ ] **Step 5: Build**

Run:

```bash
cd studio
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add studio/src
git commit -m "feat: add runtime loading shell"
```

## Task 7: Add Brief, Spec, and Taskboard Editors

**Files:**
- Create: `studio/src/components/ProjectBrief.tsx`
- Create: `studio/src/components/ProjectSpecView.tsx`
- Create: `studio/src/components/TaskboardView.tsx`
- Modify: `studio/src/App.tsx`

- [ ] **Step 1: Add Project Brief editor**

Create `studio/src/components/ProjectBrief.tsx`:

```tsx
import { useState } from "react";
import { saveProjectBrief } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface ProjectBriefProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectBrief({ snapshot, onSnapshotChange }: ProjectBriefProps) {
  const [draft, setDraft] = useState(snapshot.projectBrief);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      onSnapshotChange(await saveProjectBrief(snapshot.knotRoot, draft));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Project Brief</h2>
      <label className="field wide">
        <span>Brief markdown</span>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={18} />
      </label>
      <button className="primary-button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save brief"}
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Add structured Project Spec editor**

Create `studio/src/components/ProjectSpecView.tsx`:

```tsx
import { useMemo, useState } from "react";
import { saveProjectSpec } from "../lib/knot/tauri";
import type { ProjectSpec, RuntimeSnapshot } from "../lib/knot/types";

interface ProjectSpecViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function ProjectSpecView({ snapshot, onSnapshotChange }: ProjectSpecViewProps) {
  const initialSpec = useMemo(() => parseSpec(snapshot.projectSpecJson), [snapshot.projectSpecJson]);
  const [draft, setDraft] = useState<ProjectSpec | null>(initialSpec.ok ? initialSpec.value : null);
  const [saving, setSaving] = useState(false);

  if (!initialSpec.ok || !draft) {
    return (
      <section className="panel">
        <h2>Project Spec</h2>
        <p className="error-text">{initialSpec.message}</p>
      </section>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      onSnapshotChange(await saveProjectSpec(snapshot.knotRoot, JSON.stringify(draft, null, 2) + "\n"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Project Spec</h2>
      <div className="form-grid">
        <label className="field">
          <span>Project id</span>
          <input value={draft.project_id} onChange={(event) => setDraft({ ...draft, project_id: event.target.value })} />
        </label>
        <label className="field">
          <span>Project type</span>
          <input value={draft.project_type} onChange={(event) => setDraft({ ...draft, project_type: event.target.value })} />
        </label>
        <label className="field">
          <span>Target medium</span>
          <input value={draft.target_medium} onChange={(event) => setDraft({ ...draft, target_medium: event.target.value })} />
        </label>
        <label className="field">
          <span>Language</span>
          <input value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })} />
        </label>
        <label className="field">
          <span>Audience</span>
          <input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} />
        </label>
        <label className="field">
          <span>Stages, comma-separated</span>
          <input
            value={draft.workflow.stages.join(", ")}
            onChange={(event) =>
              setDraft({
                ...draft,
                workflow: {
                  ...draft.workflow,
                  stages: event.target.value.split(",").map((stage) => stage.trim()).filter(Boolean),
                },
              })
            }
          />
        </label>
      </div>
      <button className="primary-button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save spec"}
      </button>
    </section>
  );
}

function parseSpec(json: string): { ok: true; value: ProjectSpec } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as ProjectSpec };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 3: Add Taskboard editor with validation preview**

Create `studio/src/components/TaskboardView.tsx`:

```tsx
import { useMemo, useState } from "react";
import { saveTaskboard } from "../lib/knot/tauri";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";

interface TaskboardViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function TaskboardView({ snapshot, onSnapshotChange }: TaskboardViewProps) {
  const [draft, setDraft] = useState(snapshot.taskboardJson);
  const parsed = useMemo(() => parseTaskboard(draft), [draft]);
  const issues = parsed.ok ? validateTaskboardBasics(parsed.value) : [];
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!parsed.ok || issues.some((issue) => issue.severity === "error")) {
      return;
    }
    setSaving(true);
    try {
      onSnapshotChange(await saveTaskboard(snapshot.knotRoot, JSON.stringify(parsed.value, null, 2) + "\n"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Taskboard</h2>
      <div className="split-panel">
        <label className="field wide">
          <span>Taskboard JSON</span>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={24} />
        </label>
        <aside className="validation-list">
          <h3>Validation</h3>
          {!parsed.ok ? <p className="error-text">{parsed.message}</p> : null}
          {parsed.ok && issues.length === 0 ? <p>No client-side issues.</p> : null}
          {issues.map((issue) => (
            <p key={`${issue.path}-${issue.message}`} className={issue.severity === "error" ? "error-text" : ""}>
              <strong>{issue.path}</strong>: {issue.message}
            </p>
          ))}
        </aside>
      </div>
      <button className="primary-button" onClick={handleSave} disabled={!parsed.ok || saving}>
        {saving ? "Saving..." : "Save taskboard"}
      </button>
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 4: Wire editors into App**

Modify `studio/src/App.tsx` so its render block includes:

```tsx
{activeSection === "settings" ? (
  <Settings onRuntimeLoaded={handleRuntimeLoaded} />
) : !snapshot ? (
  <section className="panel">
    <h2>Open a runtime first</h2>
    <p>Use Settings to open a local Knot project.</p>
  </section>
) : activeSection === "brief" ? (
  <ProjectBrief snapshot={snapshot} onSnapshotChange={setSnapshot} />
) : activeSection === "spec" ? (
  <ProjectSpecView snapshot={snapshot} onSnapshotChange={setSnapshot} />
) : activeSection === "taskboard" ? (
  <TaskboardView snapshot={snapshot} onSnapshotChange={setSnapshot} />
) : (
  <section className="panel">
    <h2>{activeSection}</h2>
    <p>Runtime is loaded.</p>
  </section>
)}
```

Add imports:

```tsx
import { ProjectBrief } from "./components/ProjectBrief";
import { ProjectSpecView } from "./components/ProjectSpecView";
import { TaskboardView } from "./components/TaskboardView";
```

- [ ] **Step 5: Add split-panel CSS**

Append to `studio/src/styles.css`:

```css
.wide {
  max-width: none;
}

textarea {
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.split-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.validation-list {
  border: 1px solid #d9dee8;
  border-radius: 8px;
  padding: 14px;
  background: #f8fafc;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
```

- [ ] **Step 6: Build**

Run:

```bash
cd studio
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add studio/src
git commit -m "feat: add runtime file editors"
```

## Task 8: Add Story Inspector and Validation Center

**Files:**
- Create: `studio/src/components/StoryInspector.tsx`
- Create: `studio/src/components/ValidationCenter.tsx`
- Modify: `studio/src/components/TaskboardView.tsx`
- Modify: `studio/src/App.tsx`

- [ ] **Step 1: Add Story Inspector component**

Create `studio/src/components/StoryInspector.tsx`:

```tsx
import type { Story } from "../lib/knot/types";

interface StoryInspectorProps {
  story: Story;
  onChange: (story: Story) => void;
}

export function StoryInspector({ story, onChange }: StoryInspectorProps) {
  return (
    <aside className="validation-list">
      <h3>Story Inspector</h3>
      <label className="field">
        <span>Title</span>
        <input value={story.title} onChange={(event) => onChange({ ...story, title: event.target.value })} />
      </label>
      <label className="field">
        <span>Stage</span>
        <input value={story.stage} onChange={(event) => onChange({ ...story, stage: event.target.value })} />
      </label>
      <label className="field">
        <span>Status</span>
        <select value={story.status} onChange={(event) => onChange({ ...story, status: event.target.value as Story["status"] })}>
          <option value="todo">todo</option>
          <option value="ready">ready</option>
          <option value="in_progress">in_progress</option>
          <option value="in_review">in_review</option>
          <option value="needs_revision">needs_revision</option>
          <option value="blocked">blocked</option>
          <option value="done">done</option>
        </select>
      </label>
      <label className="field">
        <span>Priority</span>
        <input
          type="number"
          min={1}
          value={story.priority}
          onChange={(event) => onChange({ ...story, priority: Number(event.target.value) })}
        />
      </label>
      <label className="field">
        <span>Inputs, one per line</span>
        <textarea
          rows={5}
          value={story.inputs.join("\n")}
          onChange={(event) => onChange({ ...story, inputs: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
        />
      </label>
      <label className="field">
        <span>Outputs, one per line</span>
        <textarea
          rows={5}
          value={story.outputs.join("\n")}
          onChange={(event) => onChange({ ...story, outputs: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
        />
      </label>
      <label className="field">
        <span>Required gates, comma-separated</span>
        <input
          value={story.review_policy.required_gates.join(", ")}
          onChange={(event) =>
            onChange({
              ...story,
              review_policy: {
                ...story.review_policy,
                required_gates: event.target.value
                  .split(",")
                  .map((gate) => gate.trim())
                  .filter(Boolean) as Story["review_policy"]["required_gates"],
              },
            })
          }
        />
      </label>
    </aside>
  );
}
```

- [ ] **Step 2: Add Validation Center component**

Create `studio/src/components/ValidationCenter.tsx`:

```tsx
import { useMemo } from "react";
import { detectDependencyCycles } from "../lib/knot/graph";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";

interface ValidationCenterProps {
  snapshot: RuntimeSnapshot;
}

export function ValidationCenter({ snapshot }: ValidationCenterProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);

  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Validation Center</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  const issues = validateTaskboardBasics(parsed.value);
  const cycles = detectDependencyCycles(parsed.value);

  return (
    <section className="panel">
      <h2>Validation Center</h2>
      {issues.length === 0 && cycles.length === 0 ? <p>No client-side validation issues.</p> : null}
      {issues.map((issue) => (
        <p key={`${issue.path}-${issue.message}`} className={issue.severity === "error" ? "error-text" : ""}>
          <strong>{issue.path}</strong>: {issue.message}
        </p>
      ))}
      {cycles.map((cycle) => (
        <p key={cycle.join("-")} className="error-text">
          <strong>dependency cycle</strong>: {cycle.join(" -> ")}
        </p>
      ))}
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 3: Replace Taskboard raw-only view with story list and inspector**

Replace `studio/src/components/TaskboardView.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { saveTaskboard } from "../lib/knot/tauri";
import type { RuntimeSnapshot, Story, Taskboard } from "../lib/knot/types";
import { validateTaskboardBasics } from "../lib/knot/validation";
import { StoryInspector } from "./StoryInspector";

interface TaskboardViewProps {
  snapshot: RuntimeSnapshot;
  onSnapshotChange: (snapshot: RuntimeSnapshot) => void;
}

export function TaskboardView({ snapshot, onSnapshotChange }: TaskboardViewProps) {
  const initial = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  const [draft, setDraft] = useState<Taskboard | null>(initial.ok ? initial.value : null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(initial.ok ? initial.value.stories[0]?.id ?? null : null);
  const [saving, setSaving] = useState(false);

  if (!initial.ok || !draft) {
    return (
      <section className="panel">
        <h2>Taskboard</h2>
        <p className="error-text">{initial.message}</p>
      </section>
    );
  }

  const selectedStory = draft.stories.find((story) => story.id === selectedStoryId) ?? draft.stories[0];
  const issues = validateTaskboardBasics(draft);

  function updateSelectedStory(nextStory: Story) {
    setDraft({
      ...draft,
      stories: draft.stories.map((story) => (story.id === nextStory.id ? nextStory : story)),
    });
  }

  async function handleSave() {
    if (issues.some((issue) => issue.severity === "error")) {
      return;
    }
    setSaving(true);
    try {
      onSnapshotChange(await saveTaskboard(snapshot.knotRoot, JSON.stringify(draft, null, 2) + "\n"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <h2>Taskboard</h2>
        <button className="primary-button" onClick={handleSave} disabled={saving || issues.some((issue) => issue.severity === "error")}>
          {saving ? "Saving..." : "Save taskboard"}
        </button>
      </div>
      <div className="split-panel">
        <div className="table-list">
          {draft.stories.map((story) => (
            <button
              key={story.id}
              className={`artifact-item ${story.id === selectedStory?.id ? "active" : ""}`}
              onClick={() => setSelectedStoryId(story.id)}
            >
              <strong>{story.id}</strong>
              <span>{story.title}</span>
              <small>
                {story.stage} · {story.status}
              </small>
            </button>
          ))}
        </div>
        {selectedStory ? <StoryInspector story={selectedStory} onChange={updateSelectedStory} /> : null}
      </div>
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 4: Wire Validation Center into App**

Modify `studio/src/App.tsx` imports:

```tsx
import { ValidationCenter } from "./components/ValidationCenter";
```

Add render branch:

```tsx
) : activeSection === "overview" || activeSection === "validation" ? (
  <ValidationCenter snapshot={snapshot} />
```

- [ ] **Step 5: Build**

Run:

```bash
cd studio
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add studio/src
git commit -m "feat: add story inspector and validation center"
```

## Task 9: Add Workflow Builder and Gate Rules Views

**Files:**
- Create: `studio/src/components/WorkflowBuilder.tsx`
- Create: `studio/src/components/GateRules.tsx`
- Modify: `studio/src/App.tsx`

- [ ] **Step 1: Add Workflow Builder**

Create `studio/src/components/WorkflowBuilder.tsx`:

```tsx
import { useMemo } from "react";
import { taskboardToGraph, detectDependencyCycles } from "../lib/knot/graph";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface WorkflowBuilderProps {
  snapshot: RuntimeSnapshot;
}

export function WorkflowBuilder({ snapshot }: WorkflowBuilderProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Workflow Builder</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  const graph = taskboardToGraph(parsed.value);
  const cycles = detectDependencyCycles(parsed.value);
  const stages = Array.from(new Set(parsed.value.stories.map((story) => story.stage)));

  return (
    <section className="panel">
      <h2>Workflow Builder</h2>
      {cycles.length > 0 ? (
        <div className="banner error-text">Dependency cycle: {cycles[0].join(" -> ")}</div>
      ) : null}
      <div className="stage-board">
        {stages.map((stage) => (
          <div className="stage-column" key={stage}>
            <h3>{stage}</h3>
            {graph.nodes
              .filter((node) => node.stage === stage)
              .map((node) => (
                <article className="story-card" key={node.id}>
                  <strong>{node.id}</strong>
                  <span>{node.label}</span>
                  <small>{node.status}</small>
                </article>
              ))}
          </div>
        ))}
      </div>
      <h3>Dependencies</h3>
      <ul>
        {graph.edges.map((edge) => (
          <li key={`${edge.from}-${edge.to}`}>
            {edge.from} -> {edge.to}
          </li>
        ))}
      </ul>
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 2: Add Gate Rules view**

Create `studio/src/components/GateRules.tsx`:

```tsx
import { useMemo } from "react";
import type { RuntimeSnapshot, Taskboard } from "../lib/knot/types";

interface GateRulesProps {
  snapshot: RuntimeSnapshot;
}

export function GateRules({ snapshot }: GateRulesProps) {
  const parsed = useMemo(() => parseTaskboard(snapshot.taskboardJson), [snapshot.taskboardJson]);
  if (!parsed.ok) {
    return (
      <section className="panel">
        <h2>Gate Rules</h2>
        <p className="error-text">{parsed.message}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Gate Rules</h2>
      <div className="table-list">
        {parsed.value.stories.map((story) => (
          <article className="table-row" key={story.id}>
            <div>
              <strong>{story.id}</strong>
              <p>{story.title}</p>
            </div>
            <div>{story.review_policy.required_gates.join(", ")}</div>
            <div>{story.review_policy.blocking === false ? "non-blocking" : "blocking"}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function parseTaskboard(json: string): { ok: true; value: Taskboard } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(json) as Taskboard };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Step 3: Wire views into App**

Modify `studio/src/App.tsx` imports:

```tsx
import { GateRules } from "./components/GateRules";
import { WorkflowBuilder } from "./components/WorkflowBuilder";
```

Add render branches:

```tsx
) : activeSection === "workflow" ? (
  <WorkflowBuilder snapshot={snapshot} />
) : activeSection === "gates" ? (
  <GateRules snapshot={snapshot} />
```

- [ ] **Step 4: Add workflow CSS**

Append to `studio/src/styles.css`:

```css
.banner {
  border: 1px solid #f4b3ad;
  border-radius: 6px;
  background: #fff4f2;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.stage-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.stage-column {
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}

.story-card {
  display: grid;
  gap: 4px;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
  margin-bottom: 10px;
}

.table-list {
  display: grid;
  gap: 10px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 140px;
  gap: 16px;
  align-items: center;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  padding: 12px;
}

.table-row p {
  margin: 4px 0 0;
}
```

- [ ] **Step 5: Build and test graph helpers**

Run:

```bash
cd studio
npm run test -- --run src/test/graph.test.ts src/test/validation.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add studio/src
git commit -m "feat: add workflow and gate views"
```

## Task 10: Add Preflight and Loop Process Commands

**Files:**
- Create: `studio/src-tauri/src/process.rs`
- Modify: `studio/src-tauri/src/lib.rs`
- Modify: `studio/src-tauri/src/commands.rs`
- Modify: `studio/src/lib/knot/tauri.ts`
- Modify: `studio/src/lib/knot/types.ts`

- [ ] **Step 1: Add process result types to frontend**

Modify `studio/src/lib/knot/types.ts`:

```ts
export interface CommandRunResult {
  status: "pass" | "fail";
  exitCode: number | null;
  stdout: string;
  stderr: string;
}
```

Modify `studio/src/lib/knot/tauri.ts`:

```ts
import type { CommandRunResult, RuntimeSnapshot } from "./types";

export async function runPreflight(knotRoot: string): Promise<CommandRunResult> {
  return invoke<CommandRunResult>("run_preflight", { knotRoot });
}

export async function runLoopOnce(knotRoot: string, tool: "claude" | "amp", maxIterations: number): Promise<CommandRunResult> {
  return invoke<CommandRunResult>("run_loop_once", { knotRoot, tool, maxIterations });
}
```

- [ ] **Step 2: Add Rust process runner**

Create `studio/src-tauri/src/process.rs`:

```rust
use serde::Serialize;
use std::path::Path;
use std::process::Command;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProcessError {
    #[error("process failed to start: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandRunResult {
    pub status: String,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

pub fn run_preflight_process(knot_root: &Path) -> Result<CommandRunResult, ProcessError> {
    let output = Command::new("python3")
        .arg("automation/scripts/run_preflight.py")
        .arg("--knot-dir")
        .arg(".")
        .current_dir(knot_root)
        .output()?;

    Ok(CommandRunResult {
        status: if output.status.success() { "pass".to_string() } else { "fail".to_string() },
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

pub fn run_loop_process(knot_root: &Path, tool: &str, max_iterations: u32) -> Result<CommandRunResult, ProcessError> {
    let output = Command::new("./core/knot.sh")
        .arg("--tool")
        .arg(tool)
        .arg(max_iterations.to_string())
        .current_dir(knot_root)
        .output()?;

    Ok(CommandRunResult {
        status: if output.status.success() { "pass".to_string() } else { "fail".to_string() },
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}
```

- [ ] **Step 3: Expose process commands**

Modify `studio/src-tauri/src/commands.rs`:

```rust
use crate::process::{run_loop_process, run_preflight_process, CommandRunResult};

#[tauri::command]
pub fn run_preflight(knot_root: String) -> Result<CommandRunResult, String> {
    run_preflight_process(&PathBuf::from(knot_root)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn run_loop_once(knot_root: String, tool: String, max_iterations: u32) -> Result<CommandRunResult, String> {
    if tool != "claude" && tool != "amp" {
        return Err(format!("Unsupported tool: {tool}"));
    }
    run_loop_process(&PathBuf::from(knot_root), &tool, max_iterations).map_err(|error| error.to_string())
}
```

Modify `studio/src-tauri/src/lib.rs`:

```rust
pub mod commands;
pub mod process;
pub mod runtime;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::open_runtime,
            commands::save_project_brief,
            commands::save_project_spec,
            commands::save_taskboard,
            commands::run_preflight,
            commands::run_loop_once
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Knot Studio");
}
```

- [ ] **Step 4: Compile**

Run:

```bash
cd studio
npm run build
cd src-tauri
cargo check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio/src/lib/knot studio/src-tauri/src
git commit -m "feat: add preflight and loop commands"
```

## Task 11: Add Run Console UI

**Files:**
- Create: `studio/src/components/RunConsole.tsx`
- Modify: `studio/src/App.tsx`
- Modify: `studio/src/styles.css`

- [ ] **Step 1: Implement Run Console**

Create `studio/src/components/RunConsole.tsx`:

```tsx
import { useState } from "react";
import { runLoopOnce, runPreflight } from "../lib/knot/tauri";
import type { CommandRunResult, RuntimeSnapshot } from "../lib/knot/types";

interface RunConsoleProps {
  snapshot: RuntimeSnapshot;
}

type RunState = "idle" | "preflight" | "running" | "completed" | "failed";

export function RunConsole({ snapshot }: RunConsoleProps) {
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<CommandRunResult | null>(null);
  const [tool, setTool] = useState<"claude" | "amp">("claude");

  async function handlePreflight() {
    setState("preflight");
    const nextResult = await runPreflight(snapshot.knotRoot);
    setResult(nextResult);
    setState(nextResult.status === "pass" ? "completed" : "failed");
  }

  async function handleRunLoop() {
    setState("running");
    const nextResult = await runLoopOnce(snapshot.knotRoot, tool, 10);
    setResult(nextResult);
    setState(nextResult.status === "pass" ? "completed" : "failed");
  }

  const busy = state === "preflight" || state === "running";

  return (
    <section className="panel">
      <h2>Run Console</h2>
      <div className="run-controls">
        <label className="field compact">
          <span>AI tool</span>
          <select value={tool} onChange={(event) => setTool(event.target.value as "claude" | "amp")}>
            <option value="claude">claude</option>
            <option value="amp">amp</option>
          </select>
        </label>
        <button className="primary-button" disabled={busy} onClick={handlePreflight}>
          Run preflight
        </button>
        <button className="primary-button" disabled={busy} onClick={handleRunLoop}>
          Start loop
        </button>
        <span className="status-pill">{state}</span>
      </div>
      <pre className="log-output">{formatResult(result)}</pre>
    </section>
  );
}

function formatResult(result: CommandRunResult | null): string {
  if (!result) {
    return "No command has run yet.";
  }
  return [
    `status: ${result.status}`,
    `exitCode: ${result.exitCode}`,
    "",
    "stdout:",
    result.stdout,
    "",
    "stderr:",
    result.stderr,
  ].join("\n");
}
```

- [ ] **Step 2: Wire Run Console**

Modify `studio/src/App.tsx` imports:

```tsx
import { RunConsole } from "./components/RunConsole";
```

Add render branch:

```tsx
) : activeSection === "run" ? (
  <RunConsole snapshot={snapshot} />
```

- [ ] **Step 3: Add console styles**

Append to `studio/src/styles.css`:

```css
.run-controls {
  display: flex;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}

.compact {
  width: 180px;
  margin-bottom: 0;
}

.log-output {
  min-height: 360px;
  overflow: auto;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #111827;
  color: #dbeafe;
  padding: 14px;
  white-space: pre-wrap;
}
```

- [ ] **Step 4: Build**

Run:

```bash
cd studio
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio/src
git commit -m "feat: add run console"
```

## Task 12: Add Outputs, Reviews, and Progress Browser

**Files:**
- Modify: `studio/src-tauri/src/runtime.rs`
- Modify: `studio/src-tauri/src/commands.rs`
- Modify: `studio/src-tauri/src/lib.rs`
- Modify: `studio/src/lib/knot/types.ts`
- Modify: `studio/src/lib/knot/tauri.ts`
- Create: `studio/src/components/OutputsBrowser.tsx`
- Modify: `studio/src/App.tsx`

- [ ] **Step 1: Add artifact listing types**

Modify `studio/src/lib/knot/types.ts`:

```ts
export interface ArtifactEntry {
  path: string;
  kind: "output" | "review" | "progress";
  exists: boolean;
  contents: string;
}
```

Modify `studio/src/lib/knot/tauri.ts`:

```ts
import type { ArtifactEntry, CommandRunResult, RuntimeSnapshot } from "./types";

export async function listArtifacts(knotRoot: string): Promise<ArtifactEntry[]> {
  return invoke<ArtifactEntry[]>("list_artifacts", { knotRoot });
}
```

- [ ] **Step 2: Add backend artifact listing**

Modify `studio/src-tauri/src/runtime.rs`:

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactEntry {
    pub path: String,
    pub kind: String,
    pub exists: bool,
    pub contents: String,
}

pub fn list_runtime_artifacts(knot_root: &Path) -> Result<Vec<ArtifactEntry>, RuntimeError> {
    let mut entries = Vec::new();
    let progress = knot_root.join("runtime/progress.txt");
    entries.push(read_artifact(knot_root, &progress, "progress")?);

    let reviews = knot_root.join("runtime/reviews");
    if reviews.exists() {
        collect_files(knot_root, &reviews, "review", &mut entries)?;
    }

    let outputs = knot_root.parent().unwrap_or(knot_root).join("outputs");
    if outputs.exists() {
        collect_files(knot_root, &outputs, "output", &mut entries)?;
    }

    entries.sort_by(|left, right| left.path.cmp(&right.path));
    Ok(entries)
}

fn collect_files(
    knot_root: &Path,
    dir: &Path,
    kind: &str,
    entries: &mut Vec<ArtifactEntry>,
) -> Result<(), RuntimeError> {
    for item in fs::read_dir(dir)? {
        let item = item?;
        let path = item.path();
        if path.is_dir() {
            collect_files(knot_root, &path, kind, entries)?;
        } else {
            entries.push(read_artifact(knot_root, &path, kind)?);
        }
    }
    Ok(())
}

fn read_artifact(knot_root: &Path, path: &Path, kind: &str) -> Result<ArtifactEntry, RuntimeError> {
    let exists = path.exists();
    let contents = if exists { fs::read_to_string(path).unwrap_or_default() } else { String::new() };
    let base = knot_root.parent().unwrap_or(knot_root);
    let relative = path.strip_prefix(base).unwrap_or(path).display().to_string();
    Ok(ArtifactEntry {
        path: relative,
        kind: kind.to_string(),
        exists,
        contents,
    })
}
```

Modify `studio/src-tauri/src/commands.rs`:

```rust
use crate::runtime::{list_runtime_artifacts, ArtifactEntry};

#[tauri::command]
pub fn list_artifacts(knot_root: String) -> Result<Vec<ArtifactEntry>, String> {
    list_runtime_artifacts(&PathBuf::from(knot_root)).map_err(|error| error.to_string())
}
```

Modify `studio/src-tauri/src/lib.rs` to include `commands::list_artifacts` in `generate_handler!`.

- [ ] **Step 3: Add Outputs Browser UI**

Create `studio/src/components/OutputsBrowser.tsx`:

```tsx
import { useState } from "react";
import { listArtifacts } from "../lib/knot/tauri";
import type { ArtifactEntry, RuntimeSnapshot } from "../lib/knot/types";

interface OutputsBrowserProps {
  snapshot: RuntimeSnapshot;
}

export function OutputsBrowser({ snapshot }: OutputsBrowserProps) {
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [selected, setSelected] = useState<ArtifactEntry | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    try {
      const nextArtifacts = await listArtifacts(snapshot.knotRoot);
      setArtifacts(nextArtifacts);
      setSelected(nextArtifacts[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <h2>Outputs, Reviews, and Progress</h2>
        <button className="primary-button" onClick={handleRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="artifact-browser">
        <aside className="artifact-list">
          {artifacts.map((artifact) => (
            <button
              key={artifact.path}
              className={`artifact-item ${selected?.path === artifact.path ? "active" : ""}`}
              onClick={() => setSelected(artifact)}
            >
              <strong>{artifact.kind}</strong>
              <span>{artifact.path}</span>
            </button>
          ))}
        </aside>
        <pre className="artifact-preview">{selected ? selected.contents : "Select an artifact."}</pre>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire Outputs Browser**

Modify `studio/src/App.tsx` imports:

```tsx
import { OutputsBrowser } from "./components/OutputsBrowser";
```

Add render branch:

```tsx
) : activeSection === "outputs" ? (
  <OutputsBrowser snapshot={snapshot} />
```

- [ ] **Step 5: Add artifact styles**

Append to `studio/src/styles.css`:

```css
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.artifact-browser {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  min-height: 520px;
}

.artifact-list {
  display: grid;
  align-content: start;
  gap: 8px;
}

.artifact-item {
  display: grid;
  gap: 4px;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px;
  text-align: left;
}

.artifact-item.active {
  border-color: #2457c5;
  background: #eef4ff;
}

.artifact-preview {
  margin: 0;
  overflow: auto;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
  white-space: pre-wrap;
}
```

- [ ] **Step 6: Build and compile**

Run:

```bash
cd studio
npm run build
cd src-tauri
cargo check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add studio
git commit -m "feat: add artifact browser"
```

## Task 13: Add README Documentation and End-to-End Verification

**Files:**
- Create: `studio/README.md`
- Modify: `README.md`

- [ ] **Step 1: Add Studio README**

Create `studio/README.md`:

````markdown
# Knot Studio

Knot Studio is the local desktop workflow builder and execution console for Knot.

## Development

Install frontend dependencies:

```bash
cd studio
npm install
```

Run frontend checks:

```bash
npm run test -- --run
npm run build
```

Run Rust checks:

```bash
cd src-tauri
cargo test
cargo check
```

Run the desktop app:

```bash
cd studio
npm run tauri dev
```

## MVP Capabilities

- Open an existing local Knot project.
- Edit `runtime/project-brief.md`.
- Edit `runtime/project-spec.json` through structured fields.
- Edit and validate `runtime/taskboard.json`.
- View workflow stages, stories, dependencies, and gate rules.
- Run preflight from the app.
- Start the Knot loop from the app.
- Inspect progress, review files, and output files.
````

- [ ] **Step 2: Link Studio from root README**

Modify `README.md` by adding under the directory structure section:

```markdown
- `studio/`
  Optional local desktop application for visually building and running Knot workflows.
```

Add under quick commands:

````markdown
### Knot Studio desktop app

```bash
cd studio
npm install
npm run tauri dev
```
````

- [ ] **Step 3: Run full verification**

Run from repository root:

```bash
python -m unittest discover -s knot/automation/tests
cd studio
npm run test -- --run
npm run build
cd src-tauri
cargo test
cargo check
```

Expected:

- Existing Python tests pass.
- Frontend tests pass.
- Frontend build passes.
- Rust tests pass.
- Rust check passes.

- [ ] **Step 4: Commit**

```bash
git add README.md studio/README.md
git commit -m "docs: document Knot Studio development"
```

## Self-Review Checklist

- Spec coverage: Phase 1 project setup, runtime adapter, structured spec/story editing, validation center, workflow view, gate view, run console, and artifact browser all have tasks.
- Deferred scope remains excluded: cloud accounts, billing, real-time collaboration, asset DAM, publishing integrations, analytics dashboards, and template marketplace are not implemented in this plan.
- Type consistency: frontend `RuntimeSnapshot`, `CommandRunResult`, and `ArtifactEntry` map to Rust serde camelCase structs.
- Verification: each task has a build, test, or compile command with expected result.
- Commit cadence: every task ends with a commit.
