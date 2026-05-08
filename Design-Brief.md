# Design Brief: Knot Workbench

## 产品概要

- 产品名称：Knot Workbench
- 产品类型：Desktop
- 目标用户：使用 Knot 做内容生产自动化的个人创作者、小型内容团队、工作室运营者和 AI 工作流搭建者。
- 核心功能：选择本地项目文件夹，复制 Knot 框架，调用本机 AI CLI 生成 runtime 草案，审查和修改 brief/spec/taskboard/gates，运行 preflight，手动启动 Knot loop，并查看日志、story 状态、progress、reviews 和 outputs。

## 设计方向

### 情绪关键词

- **冷静** — 默认暗色工作台，减少装饰和情绪化视觉，长时间审查 runtime、日志和状态时不疲劳。
- **精密** — 对齐、层级、状态色和交互反馈必须准确，像工程工具一样可信，不能像模板后台一样粗糙。
- **高效** — 信息默认分层呈现，主视图只放关键判断，详情进入右侧检查器、抽屉和折叠区域。

### 参考产品

| 参考产品 | 喜欢的方面 | 不喜欢的方面 |
|---------|-----------|-------------|
| Linear | 冷静克制、信息密度适中、列表和状态处理干净、快捷操作明确 | 不要把功能隐藏得过深，Knot runtime 的关键状态必须显性可见 |
| Vercel Dashboard | 暗色工具感、部署/运行状态表达清晰、页面层级清楚 | 不要过度偏云服务控制台，产品本质是本地 runtime 工作台 |
| LangGraph Studio | 工作流图、运行调试和状态追踪的产品心智接近 | 不要做成复杂调试 IDE，内容团队仍要能理解 |

### 反面参考

- n8n 节点画布风格：不要让用户误解这是通用自动化节点平台；Workflow 可以可视化，但不能把节点编排作为产品主体。
- Grafana 式监控大屏：不要满屏指标和强运维压迫感；本产品需要运行监控，但不是系统监控平台。
- Notion 式文档工作区：不要太白、太松、太文档化；Knot Workbench 是运行控制台和结构化编辑器，不是笔记应用。

## 视觉规范

### 色彩方向

- **主题模式**：暗色优先，必须支持浅色切换。
- **色彩温度**：中性偏冷。
- **品牌主色方向**：深灰、墨黑、冷白作为基础；靛蓝或冷蓝作为品牌识别和选中态方向。
- **强调色方向**：绿色用于 pass/ready/done，琥珀色用于 warning/needs revision，红色用于 fail/blocked/destructive，蓝色用于 active/generating/running。
- **品牌资产**：从零开始。需要一个极简 Knot 符号，采用线性“结 / 节点连接”图标，搭配文字品牌 `Knot Workbench`。

### 信息密度

- **密度方向**：适中分层。
- **参考基准**：接近 Vercel Dashboard 的分层方式，吸收 Linear 的紧凑列表和状态表达。
- **理由**：产品包含向导、workflow、taskboard、story inspector、preflight、console、outputs 和 settings。信息量偏大，但用户既有技术用户也有内容运营者，所以不能做成 Grafana 式高压密度，也不能做成 Notion 式宽松文档。

### 排版方向

- **字体气质**：几何无衬线，干净、理性、低噪音。
- **中文字体偏好**：优先系统默认中文字体，保持跨平台可读性。
- **标题风格**：小而精致，不做营销页式大标题。工作台内部标题应服务扫描和定位，避免 hero 级字号。

### 交互风格

- **动画程度**：适中微交互。
- **过渡效果**：drawer、toast、tab 切换、运行状态变化、日志追加使用快速、克制的渐变或位移动效；不要弹跳、漂浮、夸张曲线。
- **整体节奏**：沉稳但不迟钝。操作反馈要即时，长任务要有明确进度、日志和可停止入口。

## 核心页面视觉备注

### 首次向导

- **核心交互**：选择项目文件夹，检测或安装 `knot/`，处理已有 runtime，选择 AI CLI，确认扫描范围，生成 runtime 草案。
- **视觉方向**：偏 Vercel onboarding 的分步清晰感，但采用桌面工具密度；每一步只突出当前判断和下一步动作。
- **特殊要求**：production runtime 风险提示必须强可见，不能藏在普通 toast 里。危险操作按钮必须与普通继续按钮区分。

### Overview

- **核心交互**：查看 runtime readiness、story 状态分布、preflight 状态、下一个可执行 story、最近 progress 和主要操作。
- **视觉方向**：Vercel Dashboard 式状态总览，少量关键模块分区，不做卡片堆砌。
- **特殊要求**：Overview 必须能在 5 秒内回答“现在能不能运行、下一步做什么、哪里坏了”。

### Workflow

- **核心交互**：在 graph/stage lane 和 table view 之间切换，查看 story、stage、依赖、状态和阻塞。
- **视觉方向**：默认 graph/stage lane 参考 LangGraph Studio 的结构可视化心智，但视觉克制；table view 参考 Linear 的列表效率。
- **特殊要求**：不要做 n8n 式自由节点画布。连接线和节点只表达 Knot story 依赖，不提供通用节点编排暗示。

### Taskboard

- **核心交互**：筛选、排序、编辑 story 的 title、status、priority、inputs、outputs、dependencies、acceptance criteria 和 notes。
- **视觉方向**：Linear 式紧凑列表/表格，状态 badge 明确，行高适中。
- **特殊要求**：批量编辑和单项详情分离，复杂字段进入右侧检查器，主表不要塞满长文本。

### 右侧 Story Inspector

- **核心交互**：编辑单个 story 的结构化字段、gate、metadata 和扩展信息。
- **视觉方向**：类似 Linear issue detail / Vercel side panel，字段分组清晰，错误内联显示。
- **特殊要求**：schema 错误要映射到具体字段，避免只展示原始 JSON 错误。

### Project Brief

- **核心交互**：查看和编辑 Markdown brief，同时查看结构化摘要。
- **视觉方向**：暗色编辑器 + 预览/摘要分栏；接近开发者工具的文档编辑，而不是 Notion 文档页。
- **特殊要求**：编辑区可用 monospace 或清晰正文体，预览区保持可读，不要大段文字挤在卡片中。

### Project Spec

- **核心交互**：表单编辑 `project-spec.json` 核心字段。
- **视觉方向**：分组表单，字段说明克制，使用折叠区域处理 metadata/extensions。
- **特殊要求**：核心字段优先，JSON 高级编辑可作为辅助模式，不作为默认体验。

### Gates

- **核心交互**：配置 required gates、reviewers、revision rounds、blocking 和 review artifact paths。
- **视觉方向**：使用 segmented controls、checkboxes、badges 和列表，不做复杂规则引擎 UI。
- **特殊要求**：gate 状态颜色必须稳定统一：pass、fail、warning、blocked 不能混用。

### Preflight

- **核心交互**：运行 schema/path/dependency/preflight 检查，并定位失败。
- **视觉方向**：检查清单式界面，成功项安静，失败项突出；参考 Vercel build check 的清晰反馈。
- **特殊要求**：错误详情要连接到具体文件/story/字段，并提供下一步动作。

### Run Console

- **核心交互**：手动启动/停止 Knot loop，查看 stdout/stderr、iteration、story 状态和完成信号。
- **视觉方向**：终端风格 monospace 黑底日志，配合顶部运行状态条和右侧摘要。
- **特殊要求**：日志区域必须稳定，不因新增文本导致布局跳动；停止按钮清楚但不喧宾夺主。

### Outputs & Reviews

- **核心交互**：浏览 taskboard 声明的 outputs 和 review artifacts，预览 Markdown、JSON、TXT。
- **视觉方向**：文件树 + 预览区，参考 VS Code / Vercel log artifact 的结构感。
- **特殊要求**：文件存在性、修改时间、review pass/fail 状态要显性可见。

### Progress

- **核心交互**：按时间线查看 `progress.txt`。
- **视觉方向**：线性时间轴，强调 story id、status、artifacts、gates 和 learnings。
- **特殊要求**：不要把 progress 当纯文本墙；需要可扫读的分块。

### Settings

- **核心交互**：配置 AI CLI、最大迭代次数、扫描排除、Knot 框架来源、备份策略和主题。
- **视觉方向**：Vercel settings 式分组设置，左侧分类或纵向 section，危险设置单独分区。
- **特殊要求**：本机 CLI 可用性和版本必须清楚显示，不能让用户点生成后才知道命令不存在。

### 左侧导航

- **信息架构**：采用流程优先，不把所有文件都平铺成同级入口。
- **主入口顺序**：总览、准备项目、运行时、工作流、预检、运行、产物。
- **合并规则**：`运行时` 页面承载项目简报和项目规格；`工作流` 页面承载 graph、任务板和门禁规则；`产物` 页面承载 outputs、reviews 和 progress 时间线；`设置` 不作为主导航入口，作为准备项目或顶部工具入口进入。
- **视觉方向**：所有工作台页面统一为“Logo 图标 + Knot Workbench + 当前选中项 + 其余入口列表”。Logo 区保留英文产品名，其余菜单使用中文。
- **特殊要求**：不要在不同页面使用不同的 Logo 结构；不要让某些页面有选中态、某些页面没有选中态；主导航不得超过 7 个入口。

## 状态设计

- **空状态**：小型线性图标 + 简短文案 + 明确操作按钮。图标风格与 Knot 符号一致，不使用插画。
- **加载状态**：生成 runtime 和运行 preflight 使用步骤进度 + 日志；普通列表和详情使用 skeleton；Run Console 使用日志流和运行指示。
- **错误状态**：内联错误优先，严重风险使用固定 alert 区块。错误颜色克制但清楚，必须提供文件、story 或字段定位。

## 品牌与图标

- 产品名在 UI 中使用 `Knot Workbench`。
- 左上角使用极简 Knot 符号 + 产品名。
- 图标风格为线性、单色、低装饰，适合暗色工具界面。
- 不使用吉祥物、插画人物、渐变球、装饰性发光背景。

## 文案语言

- 除 Logo 区域保留英文产品名 `Knot Workbench` 外，所有界面标题、导航、按钮、状态说明、空状态、错误提示和辅助文案默认使用中文。
- 文件路径、CLI 命令名、JSON key、story id、gate enum、schema 字段名等技术字面量可以保留英文，以避免和实际运行文件不一致。
- 中文文案要短、准、可操作；不要写营销语，不要解释产品理念。

## 设计执行约束

- 默认暗色主题必须完整覆盖所有页面，浅色主题不能只是反色。
- 所有状态色必须在暗色和浅色下都有足够对比度。
- 工作台内部避免大面积卡片套卡片，页面区域应以工具面板、列表、表单和检查器组织。
- 内容密集区域使用稳定尺寸和滚动容器，避免日志、长路径、长 story 标题导致布局跳动。
- 长路径、CLI 输出和 JSON 内容使用 monospace，并提供换行或横向滚动策略。
- 关键操作按钮必须包含图标，优先使用 lucide 风格图标。
- 不用营销式 hero，不用大插画，不用装饰性渐变背景。
