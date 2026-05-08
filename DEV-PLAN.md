# Development Plan — Knot Workbench

> 本文件记录 Knot Workbench 的开发阶段划分、当前进度和剩余工作。
> 新 session 启动时应首先阅读本文件、`Product-Spec.md`、`Design-Brief.md` 和 `AGENTS.md`，再继续开发。

---

## Phase 1 ✅: Tauri 桌面骨架

**交付内容**：
- 搭建 `workbench/` 新桌面应用，不复用旧 `studio/` 目录和旧 Studio 计划文档。
- 创建 Tauri 2 + React + TypeScript + Vite 的可启动窗口，窗口标题显示 `Knot Workbench`。
- 配置 Rust command layer 的最小命令通路，前端能调用 Rust 并展示返回结果。
- 配置 pnpm、TypeScript、Vitest、ESLint 基础脚本，保证首个 Phase 可以编译和运行。

**关键文件**：
- `workbench/package.json` — 前端依赖、pnpm 脚本和 Tauri 启动命令。
- `workbench/index.html` — Vite 渲染入口。
- `workbench/vite.config.ts` — Vite + React + Vitest 配置。
- `workbench/tsconfig.json` — TypeScript 编译配置。
- `workbench/src/main.tsx` — React 挂载入口。
- `workbench/src/App.tsx` — 桌面应用根组件。
- `workbench/src-tauri/Cargo.toml` — Tauri、serde、thiserror、tokio 依赖配置。
- `workbench/src-tauri/src/lib.rs` — Tauri builder、插件注册和命令注册。
- `workbench/src-tauri/src/main.rs` — 桌面进程入口。
- `workbench/src-tauri/tauri.conf.json` — 应用标识、窗口尺寸和资源配置。

**验收标准**：
- 执行 `cd workbench && pnpm install` 后依赖安装成功。
- 执行 `cd workbench && pnpm tauri dev` 后桌面窗口打开并显示根界面。
- 执行 `cd workbench && pnpm test -- --run`、`pnpm build` 和 `cd src-tauri && cargo test` 均通过。

---

## Phase 2 ✅: 中文工作台信息架构与主题

**交付内容**：
- 实现暗色优先、浅色可切换的工作台布局，整体遵循设计稿的三栏结构。
- 实现统一左侧 Logo 区：极简 Knot 线性符号 + `Knot Workbench`，所有页面保持同一结构。
- 实现 7 个中文主导航入口：总览、准备项目、运行时、工作流、预检、运行、产物。
- 实现顶部状态栏和右侧检查器占位，界面文字除 Logo 外默认使用中文。

**关键文件**：
- `workbench/src/styles/tokens.css` — 暗色和浅色主题变量、状态色、间距和字体规则。
- `workbench/src/styles/global.css` — 全局布局、滚动、文字溢出和基础控件样式。
- `workbench/src/components/layout/AppShell.tsx` — 三栏工作台骨架。
- `workbench/src/components/layout/Sidebar.tsx` — Logo、中文导航、项目切换入口。
- `workbench/src/components/layout/TopStatusBar.tsx` — 项目路径、runtime、CLI、preflight、运行状态。
- `workbench/src/components/layout/InspectorPanel.tsx` — 右侧检查器容器。
- `workbench/src/components/ui/IconButton.tsx` — 带 lucide 图标和 tooltip 的图标按钮。
- `workbench/src/components/ui/SegmentedControl.tsx` — 主题、视图模式和状态筛选控件。
- `workbench/src/lib/navigation.ts` — 7 个主入口、子标签和页面元数据。

**验收标准**：
- 应用启动后默认进入暗色主题，主题切换到浅色后所有文字和状态色仍可读。
- 左侧菜单只出现 7 个中文主入口，Logo 区只有 Knot 图标和 `Knot Workbench`。
- 所有主入口点击后中间区域和右侧检查器标题同步变化。
- 执行 `cd workbench && pnpm test -- --run` 和 `pnpm build` 通过。

---

## Phase 3 ✅: 项目选择、设置和运行时状态模型

**交付内容**：
- 实现选择宿主项目文件夹，读取项目路径并保存到最近项目列表。
- 实现本地应用设置：默认 AI CLI、最大迭代次数、扫描排除规则、主题、Knot 模板来源。
- 实现 runtime 状态模型，区分未加载、缺少 `knot/`、runtime 缺失、empty、demo、production、reviewing、ready、running、failed、completed。
- 实现 CLI 检测，识别 `claude` 和 `amp` 是否可执行并读取版本输出。

**关键文件**：
- `workbench/src-tauri/src/settings.rs` — 应用设置读写，存储最近项目和运行偏好。
- `workbench/src-tauri/src/project.rs` — 宿主项目路径检测、Knot 目录探测、项目摘要。
- `workbench/src-tauri/src/cli.rs` — `claude`、`amp` 可用性和版本检测。
- `workbench/src-tauri/src/errors.rs` — 文件、权限、命令、JSON 解析错误的结构化错误类型。
- `workbench/src/lib/tauri/commands.ts` — 前端调用 Rust 命令的类型化封装。
- `workbench/src/lib/settings.ts` — 前端设置状态和持久化调用。
- `workbench/src/lib/knot/status.ts` — runtime 状态枚举、状态文案和状态色映射。
- `workbench/src/views/PrepareProjectView.tsx` — 准备项目页面，承载文件夹选择、最近项目、CLI 与设置入口。

**验收标准**：
- 用户能在“准备项目”选择本地文件夹，并看到路径、Knot 检测摘要和最近项目更新。
- 当 `claude` 或 `amp` 不存在时，界面显示具体缺失命令，不允许进入生成动作。
- 关闭再打开应用后，最近项目、主题、默认 CLI 和最大迭代次数仍保留。
- 执行 `cd workbench && pnpm test -- --run`、`pnpm build` 和 `cd src-tauri && cargo test` 通过。

---

## Phase 4 ✅: Knot 模板复制与 runtime 保护

**交付内容**：
- 创建可打包的 Knot 框架模板，包含 `core/`、`automation/`、`examples/starter-empty/` 和 starter runtime 文件。
- 实现从当前仓库同步模板到 Tauri 资源目录的脚本，确保应用打包时带上最新 Knot 框架。
- 实现将模板复制到 `<宿主项目>/knot/`，复制前检查目标目录冲突和写权限。
- 实现 production runtime 保护：展示 project id、story 数量、状态分布、progress 摘要、reviews 摘要，并要求用户选择“备份后替换”“原地刷新”或“另选目录”。

**关键文件**：
- `workbench/scripts/sync_knot_template.py` — 从仓库 `knot/` 复制可分发模板到 Tauri 资源目录。
- `workbench/src-tauri/resources/knot-template/` — 应用内置 Knot 框架模板。
- `workbench/src-tauri/src/knot_template.rs` — 模板定位、复制、版本摘要和写权限检查。
- `workbench/src-tauri/src/runtime_detect.rs` — runtime empty、demo、production 分类逻辑。
- `workbench/src-tauri/src/backup.rs` — runtime 归档到 `knot/runtime/archive/<date>-<project-id>/`。
- `workbench/src/components/prepare/KnotDetectionPanel.tsx` — Knot 目录和 runtime 分类展示。
- `workbench/src/components/prepare/RuntimeProtectionDialog.tsx` — production runtime 处理确认。
- `workbench/src/views/PrepareProjectView.tsx` — 接入复制、备份和刷新流程。

**验收标准**：
- 对没有 `knot/` 的普通文件夹执行“复制 Knot 框架”后，目标目录出现可运行的 `<项目>/knot/core/` 和 `<项目>/knot/automation/`。
- 对 production runtime 项目，用户未选择处理方案时不能写入 runtime。
- 选择“备份后替换”后，旧 runtime 核心文件和 reviews 被复制到 archive 目录，新 runtime 处理继续执行。
- 执行 `cd workbench && pnpm test -- --run`、`pnpm build` 和 `cd src-tauri && cargo test` 通过。

---

## Phase 5 ✅: 本机 AI CLI 生成 Runtime 草案

**交付内容**：
- 实现生成前扫描摘要，列出会扫描的目录、排除规则、识别到的项目文件和生成目标文件。
- 实现 Rust 受控子进程调用 `claude` 或 `amp`，禁止前端拼接任意 shell 命令。
- 构建 runtime 生成提示词，要求 AI CLI 输出 `project-brief.md`、`project-spec.json`、`taskboard.json`、`progress.txt` 四个文件的结构化草案。
- 将 AI 输出先写入 staging 区，解析和校验成功后再让用户进入审查，不自动启动 preflight 或 loop。

**关键文件**：
- `workbench/src-tauri/resources/prompts/runtime_generation.md` — 生成 runtime 草案的受控提示词。
- `workbench/src-tauri/src/project_scan.rs` — 扫描宿主项目、应用排除规则、生成扫描摘要。
- `workbench/src-tauri/src/ai_cli.rs` — AI CLI 子进程启动、stdout/stderr 流式读取、退出码处理。
- `workbench/src-tauri/src/runtime_staging.rs` — staging 文件写入、解析和提交到 `knot/runtime/`。
- `workbench/src/lib/knot/generation.ts` — 生成流程状态机和前端事件类型。
- `workbench/src/components/prepare/ScanSummary.tsx` — 扫描摘要确认界面。
- `workbench/src/components/prepare/GenerationConsole.tsx` — 生成日志、生成文件列表和失败定位。
- `workbench/src/views/PrepareProjectView.tsx` — 接入生成 Runtime 草案流程。

**验收标准**：
- 用户确认扫描摘要后才能启动 AI CLI。
- 生成阶段实时显示 stdout/stderr，失败时展示命令、退出码和最后错误片段。
- 成功生成后，`knot/runtime/project-brief.md`、`project-spec.json`、`taskboard.json`、`progress.txt` 可在 staging 审查后写入。
- runtime 生成完成后状态进入 reviewing，界面不自动运行 preflight 或 Knot loop。

---

## Phase 6 ✅: Runtime 编辑器、工作流和门禁

**交付内容**：
- 实现“运行时”页面，包含项目简报 Markdown 编辑、项目规格表单编辑和 JSON 辅助预览。
- 实现“工作流”页面，包含 DAG/阶段视图、Taskboard 表格、Story Inspector 和门禁配置。
- 实现依赖编辑并阻止依赖环，阻止删除仍被其他 story 依赖的 story。
- 实现运行中只读保护，运行期间禁止修改依赖、outputs 和 required gates。

**关键文件**：
- `workbench/src/lib/knot/types.ts` — project spec、taskboard、story、gate、review result 的 TypeScript 类型。
- `workbench/src/lib/knot/graph.ts` — story 依赖图、拓扑排序、依赖环检测。
- `workbench/src/lib/knot/taskboard.ts` — story 新增、编辑、删除、排序和状态分布计算。
- `workbench/src/components/runtime/ProjectBriefEditor.tsx` — Markdown 编辑和结构化摘要。
- `workbench/src/components/runtime/ProjectSpecForm.tsx` — project spec 分组表单。
- `workbench/src/components/workflow/WorkflowGraph.tsx` — 阶段视图和依赖连线。
- `workbench/src/components/workflow/TaskboardTable.tsx` — story 列表、筛选和排序。
- `workbench/src/components/workflow/StoryInspector.tsx` — story 详情、输入输出、依赖、验收标准。
- `workbench/src/components/workflow/GateRulesPanel.tsx` — required gates、reviewers、revision rounds、blocking 和 artifact paths。
- `workbench/src/views/RuntimeView.tsx` — 运行时页面组合。
- `workbench/src/views/WorkflowView.tsx` — 工作流页面组合。

**验收标准**：
- 用户能编辑 brief、spec 核心字段、story、依赖、输入输出和 gate，并看到右侧检查器同步更新。
- 用户创建依赖环时界面阻止保存并定位到涉及的 story id。
- 运行状态为 running 时，结构性字段显示只读状态，日志和文件预览仍可查看。
- 执行 `cd workbench && pnpm test -- --run` 和 `pnpm build` 通过。

---

## Phase 7 ✅: Runtime 校验与原子保存

**交付内容**：
- 实现保存前规范化，统一 story 排序、状态字段、gate 列表、相对路径和 JSON 缩进。
- 实现 schema 校验，复用 `knot/automation/schemas/project-spec.schema.json` 和 `taskboard.schema.json`。
- 实现路径合法性校验：输入路径存在、上游输出例外、禁止绝对路径、禁止 `../`、输出父目录可写或可创建。
- 实现原子写入和保存快照，保存失败时保留原文件并展示具体字段或路径错误。

**关键文件**：
- `workbench/src-tauri/src/schema_validation.rs` — 调用 Python schema 校验脚本并解析错误。
- `workbench/src-tauri/src/runtime_io.rs` — runtime 文件读取、规范化、临时文件写入和原子替换。
- `workbench/src-tauri/src/path_validation.rs` — taskboard 输入输出路径检查。
- `workbench/src/lib/knot/validation.ts` — 前端字段级校验、错误映射和错误分组。
- `workbench/src/components/runtime/ValidationSummary.tsx` — runtime 校验摘要和错误定位。
- `workbench/src/components/ui/FieldError.tsx` — 字段级错误展示。
- `workbench/src/views/RuntimeView.tsx` — 接入保存、校验和错误定位。
- `workbench/src/views/WorkflowView.tsx` — 接入 taskboard 保存、校验和错误定位。

**验收标准**：
- 合法 runtime 保存后，磁盘上的 `project-brief.md`、`project-spec.json` 和 `taskboard.json` 内容与界面一致。
- 非法 JSON、schema 错误、缺失输入路径、依赖环和不可写输出目录都会显示具体文件、story 或字段位置。
- 保存失败时原 runtime 文件内容不被破坏。
- 执行 `cd workbench && pnpm test -- --run`、`pnpm build` 和 `cd src-tauri && cargo test` 通过。

---

## Phase 8 ✅: 预检与 Knot Loop 运行控制

**交付内容**：
- 实现“预检”页面，运行 `python3 knot/automation/scripts/run_preflight.py --knot-dir knot` 并展示检查清单、错误详情和 `latest.json` 预览。
- 实现“运行”页面，手动启动 `knot/core/knot.sh`，传入用户设置的 AI CLI 和最大迭代次数。
- 实现 stdout/stderr 实时日志、运行状态机、停止进程、非零退出、`<promise>COMPLETE</promise>` 完成识别。
- 实现运行后刷新 taskboard、progress、reviews 和 outputs 摘要。

**关键文件**：
- `workbench/src-tauri/src/preflight.rs` — preflight 子进程、Python 解释器检测和 latest.json 读取。
- `workbench/src-tauri/src/process_manager.rs` — 单活动进程限制、日志事件、停止和退出状态。
- `workbench/src-tauri/src/knot_loop.rs` — Knot loop 命令构造、CLI 参数、迭代次数和完成信号识别。
- `workbench/src/lib/knot/runState.ts` — idle、generating、reviewing、validating、preflight、ready、running、completed、failed、stopped 状态机。
- `workbench/src/components/preflight/PreflightChecklist.tsx` — 检查项、通过状态和失败定位。
- `workbench/src/components/preflight/PreflightJsonPreview.tsx` — `latest.json` 结构化预览。
- `workbench/src/components/run/RunConsole.tsx` — 日志流、开始、停止和退出摘要。
- `workbench/src/components/run/RunSummary.tsx` — iteration、story 状态和完成信号摘要。
- `workbench/src/views/PreflightView.tsx` — 预检页面组合。
- `workbench/src/views/RunView.tsx` — 运行页面组合。

**验收标准**：
- preflight 通过前，“开始运行”按钮不可用并显示阻塞原因。
- preflight 失败时，界面展示失败文件和失败字段，能打开关联 runtime 页面。
- loop 运行时日志持续追加且不导致布局跳动，停止按钮能终止当前进程。
- 输出 `<promise>COMPLETE</promise>` 后状态显示 completed，并刷新 story、progress、reviews 和 outputs 摘要。

---

## Phase 9 ✅: 产物、Review 和 Progress 浏览

**交付内容**：
- 实现“产物”页面，合并 outputs、reviews 和 progress 三类信息，避免左侧菜单膨胀。
- 按 taskboard 声明的 outputs 和 review artifact paths 列出文件存在性、大小、修改时间和摘要。
- 实现 Markdown、JSON、TXT 预览，JSON 解析错误时展示原文和错误位置。
- 将 `progress.txt` 渲染为可扫读时间线，突出 PRECHECK、story id、status、artifacts、gates 和 learnings。

**关键文件**：
- `workbench/src-tauri/src/artifacts.rs` — outputs、reviews、progress 文件枚举和元数据读取。
- `workbench/src-tauri/src/progress.rs` — `progress.txt` 分段解析和 PRECHECK 条目识别。
- `workbench/src/lib/knot/artifacts.ts` — 前端产物树、review 状态和文件预览类型。
- `workbench/src/components/artifacts/ArtifactTree.tsx` — outputs/reviews 文件树。
- `workbench/src/components/artifacts/FilePreview.tsx` — Markdown、JSON、TXT 预览。
- `workbench/src/components/artifacts/ReviewSummary.tsx` — review pass/fail 状态摘要。
- `workbench/src/components/artifacts/ProgressTimeline.tsx` — progress 时间线。
- `workbench/src/views/ArtifactsView.tsx` — 产物页面组合。

**验收标准**：
- 用户能在一个页面切换查看 outputs、reviews 和 progress，不需要进入额外主导航。
- 缺失文件、过期文件、JSON 解析错误和 review fail 状态都有明确视觉标记。
- 长路径、长 JSON 和长日志在预览区不会撑破布局。
- 执行 `cd workbench && pnpm test -- --run` 和 `pnpm build` 通过。

---

## Phase 10 ✅: 设计校准、自动化测试和打包

**交付内容**：
- 对照 `design-exports/` 中的设计稿校准页面结构、中文文案、Logo、导航、暗色和浅色主题。
- 补齐核心单元测试和 Rust 集成测试，覆盖 runtime 分类、备份、路径校验、依赖环、CLI 检测、preflight 解析和进程状态。
- 完成 macOS 开发打包配置，生成可安装或可运行的 Tauri bundle。
- 编写 Workbench 使用说明，覆盖安装、选择项目、生成 runtime、预检、运行和查看产物。

**关键文件**：
- `workbench/src/test/navigation.test.tsx` — 中文导航、页面切换和 Logo 一致性测试。
- `workbench/src/test/validation.test.ts` — schema 错误映射、路径校验和依赖环测试。
- `workbench/src-tauri/tests/runtime_detect.rs` — runtime empty、demo、production 分类测试。
- `workbench/src-tauri/tests/runtime_io.rs` — 原子保存、备份和错误回滚测试。
- `workbench/src-tauri/tests/process_manager.rs` — preflight、loop、停止和完成信号测试。
- `workbench/src-tauri/tauri.conf.json` — macOS bundle、资源和权限配置。
- `workbench/README.md` — 本地使用说明和故障定位。
- `workbench/docs/manual-test-checklist.md` — 手工验收清单。

**验收标准**：
- 全部页面除 Logo、路径、CLI 名、JSON key、story id 和 gate enum 外均使用中文。
- 左侧 Logo 和 7 项主导航在所有页面保持统一，设置入口不出现在主导航中。
- 执行 `cd workbench && pnpm test -- --run`、`pnpm build`、`cd src-tauri && cargo test` 和 `pnpm tauri build` 通过。
- 使用一个没有 `knot/` 的测试项目，可以完整完成复制 Knot、生成 runtime 草案、审查保存、运行 preflight、手动启动 loop、查看产物的闭环。

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 桌面框架 | Tauri | 2.11.0 | 本地桌面壳、窗口管理、受控 Rust command layer。 |
| 前端框架 | React / React DOM | 19.2.5 | 工作台 UI、编辑器、状态视图和组件组合。 |
| 构建工具 | Vite | 8.0.10 | React + TypeScript 开发服务器和生产构建。 |
| 语言 | TypeScript | 6.0.3 | 前端类型、runtime 文件模型和 Tauri 命令封装。 |
| Rust 工具链 | Rust / Cargo | 1.95.0 | Tauri command layer、文件系统、进程管理和测试。 |
| Tauri API | `@tauri-apps/api` | 2.11.0 | 前端调用 Tauri 能力。 |
| 文件夹选择 | `@tauri-apps/plugin-dialog` | 2.7.1 | 打开宿主项目文件夹。 |
| 图标 | `lucide-react` | 1.14.0 | 左侧导航、按钮、状态和空状态图标。 |
| 测试 | Vitest | 4.1.5 | 前端单元测试和组件测试。 |
| 组件测试 | `@testing-library/react` | 16.3.2 | React 组件交互验证。 |
| DOM 测试环境 | jsdom | 29.1.1 | Vitest 组件测试环境。 |
| 包管理器 | pnpm | 10.33.0 | 前端依赖和脚本管理。 |
| Knot 脚本运行 | Python | 3.14.4 | 运行现有 `knot/automation/scripts/*.py`。 |
| AI CLI | `claude` / `amp` | 本机安装版本 | 由 Rust command layer 检测并调用，不内置云端 API Key。 |

---

## 技术验证来源

| 主题 | 来源 | 结论 |
|------|------|------|
| Tauri 2 桌面框架 | `https://v2.tauri.app/` | 继续采用 Tauri 2 作为桌面壳。 |
| 前端调用 Rust | `https://v2.tauri.app/develop/calling-rust/` | 使用 Tauri command 暴露受控 Rust 能力给前端。 |
| 文件夹选择 | `https://v2.tauri.app/plugin/dialog/` | 使用 dialog 插件打开宿主项目目录。 |
| 文件系统边界 | `https://v2.tauri.app/plugin/file-system/` | 复杂文件读写放在 Rust `std::fs` / `tokio::fs`，不让前端直接操作任意路径。 |
| React 版本 | `https://react.dev/versions` | React 官方文档显示当前主版本为 19.2。 |
| Vite 版本 | `https://vite.dev/releases` 和 `https://vite.dev/blog/announcing-vite8` | Vite 8 是当前 regular patch 版本线，要求 Node.js 20.19+ 或 22.12+。 |
| Vitest 用法 | `https://vitest.dev/guide/` | 使用 Vitest 作为 Vite 项目的测试运行器。 |

---

## 本地数据文件

| 文件 | 所属 Phase | 用途 |
|------|-----------|------|
| `workbench` 应用设置文件 | Phase 3 | 保存最近项目、默认 CLI、最大迭代次数、扫描排除、主题和模板来源。 |
| `<宿主项目>/knot/runtime/project-brief.md` | Phase 5 | AI 生成、用户审查和编辑的项目简报。 |
| `<宿主项目>/knot/runtime/project-spec.json` | Phase 5 | AI 生成、表单编辑和 schema 校验的项目规格。 |
| `<宿主项目>/knot/runtime/taskboard.json` | Phase 5 | AI 生成、工作流和 taskboard 编辑的 story 真相源。 |
| `<宿主项目>/knot/runtime/progress.txt` | Phase 5 | 新 runtime 初始化和后续 Knot loop 追加的进度日志。 |
| `<宿主项目>/knot/runtime/reviews/preflight/latest.json` | Phase 8 | preflight 最新结构化报告。 |
| `<宿主项目>/knot/runtime/archive/<date>-<project-id>/` | Phase 4 | production runtime 覆盖或替换前的安全备份。 |

---

## 功能依赖顺序

| 依赖链 | 开发顺序 |
|--------|----------|
| 桌面启动依赖 UI 和 Rust 通路 | Phase 1 → Phase 2 |
| 项目准备依赖路径、设置和 CLI 检测 | Phase 3 → Phase 4 → Phase 5 |
| runtime 审查依赖 AI 生成或已有 runtime 读取 | Phase 5 → Phase 6 |
| 保存依赖编辑器和字段模型 | Phase 6 → Phase 7 |
| 运行依赖保存校验和 preflight | Phase 7 → Phase 8 |
| 产物浏览依赖 preflight、loop 和 runtime 文件刷新 | Phase 8 → Phase 9 |
| 打包验收依赖完整功能闭环 | Phase 9 → Phase 10 |

---

## 设计交付物约束

| 设计文件 | 开发用途 |
|----------|----------|
| `design-exports/gr9IC.png` | 设计系统、Logo、颜色、组件密度参考。 |
| `design-exports/avgEG.png` | 首次向导和准备项目流程参考。 |
| `design-exports/yjfbW.png` | 总览页面参考。 |
| `design-exports/x8VQW.png` | 运行时 brief/spec 编辑页面参考。 |
| `design-exports/rSwtn.png` | 工作流图页面参考。 |
| `design-exports/ODcYT.png` | taskboard 表格页面参考。 |
| `design-exports/9rTNH.png` | 门禁和 progress 页面参考。 |
| `design-exports/ANNfU.png` | 预检页面参考。 |
| `design-exports/uOxW2.png` | 运行控制台页面参考。 |
| `design-exports/YBElh.png` | 产物和 review 页面参考。 |
| `design-exports/jGtfA.png` | 准备项目设置和状态变体参考。 |

---

## 已知风险与处理规则

| 风险 | 处理规则 |
|------|----------|
| AI CLI 输出格式不稳定 | Phase 5 使用结构化输出协议和 staging 区，解析失败时不写入 runtime。 |
| production runtime 被误覆盖 | Phase 4 对 production 分类强制显示确认对话，默认动作是停止写入。 |
| Python 命令名称跨平台差异 | Phase 8 Rust 层按 `python3`、`python`、`python.exe` 顺序检测，并把实际命令显示到预检详情。 |
| Windows shell 与 `knot.sh` 兼容性 | MVP 以 macOS 开发打包为首要验收；Windows/Linux 打包验证进入发布阶段前单独补测。 |
| 长日志和长路径破坏布局 | Phase 2 建立滚动容器和 monospace 溢出策略，Phase 8 和 Phase 9 复用。 |
| 前端误触任意命令执行 | 所有进程调用集中在 Rust command layer，前端只传递枚举、路径和数字参数。 |

---

## 开发规则

- 每完成一个 Phase 执行四步走：Code Review → 测试完整性 → 编译验证 → 功能测试。
- 四步走全部通过后才能 commit。
- Commit message 格式：`phase-N: 简要描述`。
- 包管理器：pnpm。
- 所有界面文字默认中文；Logo 区保留 `Knot Workbench`，路径、CLI 名、JSON key、story id 和 gate enum 保留英文。
- 不考虑旧 `studio/` 目录和旧 Studio 设计/计划文档；新实现统一放在 `workbench/`。
