# Product Spec: Knot Runtime Desktop Workbench

## 产品概述

Knot Runtime Desktop Workbench 是一个本地桌面端应用，用来把普通内容项目转换为可运行的 Knot 自动化项目，并提供 runtime 生成、审查、修改、预检、运行监控和产物查看的一体化工作台。

**目标用户**：使用 Knot 做内容生产自动化的个人创作者、小型内容团队、工作室运营者和 AI 工作流搭建者。他们有项目素材、脚本、配置、参考资料或输出要求，但不想手动复制 `knot/`、编写 `runtime/project-spec.json`、维护 `taskboard.json`、跑命令行 preflight、再去文件夹里翻 progress 和 review 结果。

**核心价值**：用户选择一个需要自动化的项目文件夹后，应用复制 Knot 框架，调用本机已有 AI CLI 通读项目内容，生成符合 Knot 规则的 runtime 草案。用户先在可视化界面审查和修改，再手动运行 preflight 和 Knot loop，并在应用里查看日志、story 状态、review、progress 和 outputs。这个产品不是通用节点自动化平台，也不是 JSON 编辑器；它是 Knot runtime 的本地生成与运行控制台。

## 应用场景

- **首次接入内容项目**：短剧工作室有一个包含 `script/`、`assets/`、`config.json` 的项目文件夹，但没有 `knot/`。运营人员打开应用，选择该文件夹，应用复制 Knot 框架，调用本机 `claude` 生成 runtime 草案。运营人员检查 story 拆分和 gate 后运行 preflight。

- **从零准备自动化任务板**：独立创作者准备做一批播客文案，项目里只有素材和目标说明。用户选择文件夹后，应用扫描项目，AI 生成 `project-brief.md`、`project-spec.json` 和 `taskboard.json`。用户在界面里调整 story 顺序、输出路径和验收标准。

- **审查已有 Knot 项目**：团队打开一个已经有 `knot/runtime` 的项目。应用检测到已有生产 runtime，展示项目 ID、story 数量、状态分布、进度历史和 review 文件摘要，并要求用户选择“备份后替换”“原地刷新”或“另选目录”，避免直接覆盖生产状态。

- **监控自动化运行**：用户确认 runtime 和 preflight 通过后，手动启动 Knot loop。应用显示实时 stdout/stderr、当前 iteration、story 状态变化、progress 追加记录、review 文件和 outputs 文件是否生成。

- **修改运行设置**：用户需要切换 AI CLI、调整最大迭代次数、修改扫描排除规则或更换 Knot 框架来源。应用在设置页提供明确控件，修改后影响后续生成和运行，不隐式改动已有 runtime。

## 功能需求

### 核心功能

- 选择宿主项目文件夹：用户点击“打开项目”并选择本地文件夹 → 系统检测该目录是否存在 `knot/`、`knot/core/`、`knot/automation/`、`knot/runtime/` → 得到项目状态摘要。

- 安装 Knot 框架：用户选择一个没有 `knot/` 的项目文件夹 → 系统把应用内置的 Knot 框架复制到 `<项目>/knot/` → 得到可运行的 Knot 基础目录。

- 保护已有 runtime：用户选择的项目已存在 `<项目>/knot/runtime` → 系统读取 runtime 核心文件并分类为 empty、demo 或 production → 对 production runtime 展示摘要并要求用户选择“备份后替换”“原地刷新”或“另选目录”，不得默认覆盖。

- 调用本机 AI CLI 生成 runtime：用户选择 AI CLI 和生成范围后点击“生成 Runtime 草案” → 系统调用本机 `claude` 或 `amp`，让模型按 Knot runtime 规则扫描项目和生成 runtime 文件 → 得到 `project-brief.md`、`project-spec.json`、`taskboard.json`、`progress.txt` 草案。

- 审查 project brief：用户打开 Brief 页面 → 系统展示 `knot/runtime/project-brief.md` 的 Markdown 内容和结构化摘要 → 用户可编辑目标、输入、输出、风格、review 要求和约束。

- 审查 project spec：用户打开 Spec 页面 → 系统以表单方式展示 `project-spec.json` 的核心字段 → 用户可修改 project id、project type、target medium、language、audience、style、workflow roots、review policy 和 naming。

- 审查 taskboard：用户打开 Taskboard 页面 → 系统展示 story 列表、状态、优先级、依赖、输入、输出、验收标准和 gate → 用户可新增、编辑、删除、排序 story。

- 可视化 workflow：用户打开 Workflow 页面 → 系统按 stage 和 dependency 展示 story 关系 → 用户选择 story 后右侧检查器显示详情，可修改依赖并阻止依赖环。

- 配置 gate：用户在 Gate 页面或 story 检查器中编辑 required gates、reviewers、max revision rounds、blocking 和 review artifact paths → 系统同步到 taskboard 对应字段。

- 保存并校验 runtime：用户保存 brief/spec/taskboard 修改 → 系统先规范化数据，再运行 schema 和路径合法性校验，通过后原子写入文件 → 得到新的 runtime 快照和校验状态。

- 运行 preflight：用户点击“运行预检” → 系统执行 `python knot/automation/scripts/run_preflight.py --knot-dir knot` → 显示 `runtime/reviews/preflight/latest.json`、progress 追加记录和每项检查结果。

- 手动启动 Knot loop：preflight 通过后，用户点击“开始运行” → 系统执行 `knot/core/knot.sh`，并传入用户设置的 AI CLI 与最大迭代次数 → 用户实时看到日志、状态和文件变化。

- 停止运行：用户点击“停止” → 系统终止当前 loop 进程，保留日志和 runtime 当前状态 → 用户可查看停止时的 story 状态、progress 和已生成文件。

- 查看产物与 review：用户打开 Outputs 页面 → 系统列出 taskboard 声明的 outputs 和 review artifacts → 用户可预览 Markdown、JSON、TXT 文件，并查看文件是否存在、最后修改时间和内容摘要。

### 辅助功能

- AI CLI 检测：用户进入设置页 → 系统检测 `claude` 和 `amp` 是否在 PATH 中可用 → 显示版本、可用性和默认选择。

- 生成前扫描摘要：用户点击生成 runtime 前 → 系统展示将扫描的目录、排除目录、已识别的项目说明和素材根目录 → 用户确认后再调用 AI CLI。

- 运行设置：用户修改最大迭代次数、默认 AI CLI、是否强制刷新 spec、扫描排除规则 → 系统保存到本地应用设置，不写入项目 runtime。

- runtime 备份：用户选择“备份后替换” → 系统把旧 runtime 核心文件和 reviews 复制到 `knot/runtime/archive/<date>-<project-id>/` → 再写入新的 runtime。

- 最近项目：用户打开应用 → 系统显示最近打开的项目列表、runtime 状态和最后运行时间 → 用户可快速重新打开。

- 错误定位：系统遇到 JSON 解析错误、schema 错误、输入路径缺失、依赖环、AI CLI 缺失、preflight 失败或 loop 非零退出 → 在界面中指向具体文件、story、字段或命令。

## UI 布局

### 整体结构

应用采用“首次向导 + 日常三栏工作台”的混合式结构。

首次打开或当前未加载项目时，进入向导流程；加载项目后进入固定工作台。

### 首次向导

向导为纵向步骤布局，顶部显示步骤进度，主体为当前步骤内容，底部为操作按钮。

步骤：

1. **选择项目**：文件夹选择按钮、最近项目列表、项目路径显示。
2. **检测 Knot**：显示是否存在 `knot/`、是否存在 runtime、runtime 分类和风险提示。
3. **安装或处理 runtime**：没有 `knot/` 时显示“复制 Knot 框架”；已有 production runtime 时显示摘要和三个选择按钮：备份后替换、原地刷新、另选目录。
4. **选择 AI CLI**：单选项 `claude` / `amp`，显示 PATH 检测结果和版本。
5. **扫描确认**：展示将扫描的目录、排除规则、识别到的项目文件、生成目标文件。
6. **生成草案**：显示 AI CLI 执行日志、生成文件列表、生成成功或失败状态。
7. **审查入口**：展示 brief/spec/taskboard 摘要，提供“进入工作台审查”按钮。

生成 runtime 后不自动启动 Knot loop。

### 日常三栏工作台

整体为三栏布局：

- 左侧固定导航，占宽约 240px。
- 中间主工作区，自适应宽度。
- 右侧检查器，占宽约 360px，可折叠。

顶部状态栏贯穿中间和右侧区域，显示项目路径、runtime 状态、当前 AI CLI、preflight 状态、运行状态和最近保存时间。

### 左侧导航

导航项：

- Overview
- Project Brief
- Project Spec
- Workflow
- Taskboard
- Gates
- Preflight
- Run Console
- Outputs & Reviews
- Progress
- Settings

左侧底部显示当前项目名称、Knot 根目录路径和“切换项目”按钮。

### 中间主工作区

- Overview：展示项目 readiness、story 状态分布、下一个可执行 story、preflight 摘要、最近 progress 记录和主要操作按钮。
- Project Brief：Markdown 编辑器 + 结构化摘要。
- Project Spec：表单编辑区，按 Project、Style、Workflow、Review Policy、Naming 分组。
- Workflow：stage lane 或 DAG 视图，story 卡片按依赖连接。
- Taskboard：表格视图，支持筛选 status、stage、priority。
- Gates：全局 gate 默认规则 + story gate 覆盖列表。
- Preflight：检查项列表、错误定位、latest.json 预览。
- Run Console：日志流、运行状态机、开始/停止按钮、iteration 摘要。
- Outputs & Reviews：文件树 + 预览区。
- Progress：按时间线渲染 `progress.txt`。
- Settings：AI CLI、最大迭代次数、扫描排除、Knot 框架来源、备份策略。

### 右侧检查器

右侧检查器根据当前选择变化：

- 选中 story：显示 story title、stage、status、priority、inputs、outputs、dependencies、acceptance criteria、review policy、notes、metadata。
- 选中 gate：显示 gate 类型、reviewer、blocking、review artifact。
- 选中文件：显示路径、存在状态、大小、修改时间和预览。
- 未选择对象：显示当前页面的操作提示和校验摘要。

## 用户使用流程

### 首次生成 runtime

1. 用户打开应用。
2. 点击“打开项目”，选择一个普通项目文件夹。
3. 系统检测项目中是否存在 `knot/`。
4. 如果没有 `knot/`，系统复制内置 Knot 框架到 `<项目>/knot/`。
5. 系统检测 `<项目>/knot/runtime` 状态。
6. 用户选择本机 AI CLI：`claude` 或 `amp`。
7. 系统展示扫描摘要，用户确认。
8. 系统调用 AI CLI 通读项目，生成 runtime 草案。
9. 用户进入工作台审查 brief/spec/taskboard。
10. 用户修改并保存 runtime。
11. 用户运行 preflight。
12. preflight 通过后，用户手动点击“开始运行”。

### 已有 production runtime 的项目

1. 用户选择项目文件夹。
2. 系统检测到 `<项目>/knot/runtime` 存在。
3. 系统读取 project id、workflow、story 数量、状态分布、progress 历史和 reviews。
4. 系统分类为 production，并显示覆盖风险。
5. 用户选择：
   - 备份后替换：归档旧 runtime，再生成新 runtime。
   - 原地刷新：保留历史，根据项目当前内容更新 runtime。
   - 另选目录：取消当前项目，返回文件夹选择。
6. 用户确认后，系统才进行写入。

### 日常运行监控

1. 用户从最近项目打开已有 Knot 项目。
2. Overview 显示 readiness、preflight 状态和下一个可执行 story。
3. 用户运行 preflight。
4. preflight 通过后，用户点击“开始运行”。
5. Run Console 显示实时日志和运行状态。
6. 用户切换到 Workflow 或 Taskboard 查看 story 状态变化。
7. 用户切换到 Outputs & Reviews 查看生成内容和审核结果。
8. 用户查看 Progress 时间线确认持久化记录。

## AI 能力需求

| 能力类型 | 用途说明 | 应用位置 |
|---------|---------|---------|
| 项目理解与摘要 | 通读宿主项目文件、识别内容类型、素材根目录、输出目标、已有说明和约束 | 点击“生成 Runtime 草案”时，由本机 AI CLI 执行 |
| Runtime 规划生成 | 根据 Knot 规则生成 `project-brief.md`、`project-spec.json`、`taskboard.json`、`progress.txt` | AI CLI 生成阶段 |
| Story 拆分 | 将项目目标拆成 reviewable content unit，生成依赖、输入、输出、验收标准和 review gate | AI CLI 生成阶段 |
| Runtime 修订建议 | 用户修改或 preflight 失败后，基于错误和项目内容建议如何调整 spec/taskboard | 后续增强；MVP 可先只提供错误定位，不自动修订 |

MVP 只调用本机已有 AI CLI，不内置云端 API Key，不直接接入 OpenAI/Anthropic API。

## 技术方向

| 维度 | 选择 | 理由 |
|------|------|------|
| 产品类型 | Desktop | 产品必须读取本地项目、复制 `knot/`、写 runtime 文件、运行 Python 脚本和本机 AI CLI，这些都是桌面端天然需求。 |
| 推荐技术栈 | Tauri 2 + React + TypeScript + Rust command layer + 现有 Python Knot scripts | Tauri 2 适合本地文件和进程控制；React/TypeScript 适合复杂工作台 UI；Rust command layer 负责安全文件操作和子进程管理；Knot 现有 Python scripts 继续作为 schema/preflight/runtime 逻辑来源。 |
| 数据存储 | 本地文件为主，本地应用设置为辅 | Knot runtime 文件是唯一业务真相；应用只保存最近项目、默认 CLI、扫描排除、界面偏好等设置。 |
| 部署方式 | 桌面安装包 | 需要分发给本地使用者，运行在 macOS/Windows/Linux。MVP 可先开发 macOS，后续补 Windows/Linux 打包验证。 |

## 技术说明

### 本地文件与进程边界

- 前端不得直接拼接任意 shell 命令。
- 所有文件读写、复制 Knot 框架、运行 preflight、运行 loop、停止进程，都通过 Tauri Rust command layer。
- 结构化保存必须先规范化、校验，再原子写入。
- 运行中禁止编辑会影响执行结构的字段，例如 story 依赖、outputs、required gates；仍允许查看日志和文件。

### Knot 框架来源

MVP 需要内置一份可复制的 Knot 框架模板，至少包含：

- `knot/core/`
- `knot/automation/`
- `knot/examples/starter-empty/`
- 初始 `knot/runtime/` 基础文件或可生成入口

用户选择普通项目文件夹时，应用复制这份内置框架到 `<项目>/knot/`。

### AI CLI 支持范围

MVP 支持：

- `claude`
- `amp`

设置页需要检测命令是否存在、展示版本或可用性、允许用户选择默认 CLI。

### 校验范围

应用至少执行：

- `project-spec.json` schema validation
- `taskboard.json` schema validation
- taskboard input path 存在性检查，除非输入是上游 story 的 output
- absolute path 和 `../` 检查
- dependency cycle 检查
- output parent directory 可写或可创建检查
- preflight 检查

### 运行状态机

Run Console 使用以下状态：

```text
idle -> generating -> reviewing -> validating -> preflight -> ready -> running -> completed
                                                               |          |
                                                               |          -> failed
                                                               |          -> stopped
                                                               -> failed
```

规则：

- runtime 生成后进入 reviewing，不自动运行。
- preflight 通过后才允许开始 loop。
- 同一 runtime 同时只能有一个 active run。
- loop 非零退出显示 failed，并保留日志。
- 用户停止运行显示 stopped，并刷新 runtime 状态。
- 如果输出包含 `<promise>COMPLETE</promise>`，显示 completed。

## 补充说明

### Runtime 文件所有权

| 文件 | 应用行为 |
|------|----------|
| `knot/runtime/project-brief.md` | AI 生成，用户可编辑，保存为 Markdown |
| `knot/runtime/project-spec.json` | AI 生成，表单编辑，schema 校验后保存 |
| `knot/runtime/taskboard.json` | AI 生成，可视化编辑，schema 和依赖校验后保存 |
| `knot/runtime/progress.txt` | 新 runtime 初始化；已有 production runtime 默认只追加，不整文件重写 |
| `knot/runtime/reviews/**` | 运行和 preflight 产生，应用只读取展示，除非用户明确清理 |
| `outputs/**` | Knot loop 产生，应用只读取展示，不作为编辑器主目标 |

### Runtime 分类

| 分类 | 判断依据 | 默认行为 |
|------|----------|----------|
| empty | runtime 缺失或只有 starter-like 文件，无有效 history | 可直接初始化 |
| demo | generic demo runtime，无项目特定内容，无生产 progress | 可提示后替换 |
| production | 有项目 ID、多个 story、进度历史、reviews、outputs 或非 demo 内容 | 必须确认，提供备份后替换、原地刷新、另选目录 |

### MVP 不做

| 暂缓功能 | 暂缓原因 |
|----------|----------|
| 云端 API Key 模型调用 | 会引入密钥管理、费用控制、上下文裁剪和供应商差异，MVP 先复用本机 CLI |
| 多人协作 | 当前 Knot 是本地文件模型，协作会引入同步和冲突解决 |
| 节点式通用自动化编排 | 产品定位是 Knot runtime 控制台，不是 n8n 替代品 |
| 模板市场 | 第一版先证明本地生成、审查、运行闭环 |
| 自动生成后立即运行 | 内容生产有审核门槛，盲跑会放大 AI 误判 |
| 云端项目存储 | 会破坏本地可移植和可版本化的核心优势 |

### 关键验收标准

- 从一个没有 `knot/` 的普通项目文件夹开始，用户可以通过应用复制 Knot 框架并生成 runtime 草案。
- 生成的 `project-spec.json` 和 `taskboard.json` 能通过 schema 校验。
- production runtime 不会被默认覆盖。
- 用户可以在可视化界面修改 story、gate、输入输出和 project spec。
- 用户可以手动运行 preflight 并看到失败定位。
- preflight 通过后，用户可以手动启动 Knot loop。
- 应用可以实时展示运行日志，并在运行后刷新 story 状态、progress、reviews 和 outputs。
- 用户不需要手写 JSON 或手动敲 Knot 命令，也能完成一次完整的 runtime 准备与运行监控。

