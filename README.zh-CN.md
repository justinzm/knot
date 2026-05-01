# Knot

[English](README.md) | **简体中文**

`Knot` 是一个面向内容生产工作流的自治循环框架。

它适合这类项目：任务必须拆小、每轮上下文有限、产物需要明确审核门禁，而且流程会持续很多轮。

默认闭环是：

`produce -> validate -> review -> revise -> approve -> persist`

## 它保留了什么

- 一次迭代只处理 1 个 story
- 每次迭代都使用 fresh context
- 用 `progress.txt` 做追加式过程记忆
- 自动循环，直到任务板完成

## 它改变了什么

`Knot` 不再默认“这是一个编程任务”。

它不把完成定义为：

- 代码写完
- 测试通过
- 提交成功

而是把完成定义为：

- 内容产物已经写出
- 结构校验通过
- 业务审核通过
- 合规审核通过
- 状态已经持久化

## 适用场景

- 剧本、提纲、分镜、提示词流水线
- 图文、营销素材、播客稿、课程内容生产
- 世界观、设定集、长期内容资产维护
- 任何需要“小任务拆分 + 审核门禁 + 多轮迭代”的内容项目

如果一个项目完全没有审核边界，只是开放式头脑风暴，那它就不是 `Knot` 最擅长的场景。

## 目录结构

- `knot/`
  要复制到宿主内容项目里的 Knot 框架目录。
- `knot/core/`
  运行入口，例如 `knot.sh` 和单轮执行 prompt。
- `knot/automation/`
  Schema、校验脚本和测试。
- `knot/runtime/`
  默认只保留一个极小通用 demo，用来展示 story、依赖、产物和审核门禁，不代表任何特定业务流水线。
- `knot/examples/starter-empty/`
  新 runtime 可复制的空白起点。
- `knot/examples/templates/`
  可选领域模板，例如 `seedance-short-drama`。
- `skills/knot-runtime/`
  可选 Agent skill 源码，用于复制到 `.agents/skills/` 或 `.claude/skills/`。
- `docs/`
  详细操作手册和 Schema 说明。

## 在内容项目中使用 Knot

推荐目录结构：

```text
my-content-project/
├── .agents/ 或 .claude/       # 可选，Agent skill 的实际安装位置
├── knot/                      # 从本仓库的 knot/ 目录复制而来
├── config.json                # 宿主项目配置，可选
├── script/                    # 源材料
├── assets/                    # 共享事实、引用资料或素材元信息
└── outputs/                   # 生成的内容产物
```

通常应该把 Knot 作为宿主项目里的 `./knot` 子目录。把本仓库的 `knot/` 目录复制到宿主项目作为 `./knot`。宿主项目负责源材料和输出产物；`knot/runtime/` 负责当前任务板、项目规格和进度记忆。

如果要让 Agent 使用随仓库发布的 runtime 初始化 skill，需要复制到 Agent 会加载的位置：

```bash
mkdir -p .agents/skills
cp -R /path/to/knot-package/skills/knot-runtime .agents/skills/knot-runtime
```

Claude Code 项目可以复制到：

```bash
mkdir -p .claude/skills
cp -R /path/to/knot-package/skills/knot-runtime .claude/skills/knot-runtime
```

## 从哪里开始

1. 先对 `knot/runtime/` 中的默认通用 demo 运行 preflight。
2. 查看 `knot/runtime/taskboard.json`，理解 story、依赖、产物和 gate 如何建模。
3. 新项目可以复制 `knot/examples/starter-empty/` 到 `knot/runtime/`，然后填写 brief、spec 和 taskboard。
4. 如果想看领域模板，可以查看 `knot/examples/templates/seedance-short-drama/`。
5. 当 `knot/runtime/` 文件已经代表你要运行的真实项目后，再启动 `knot/core/knot.sh`。

推荐入口：

- 详细操作手册：[docs/OPERATION_MANUAL.md](docs/OPERATION_MANUAL.md)
- Schema 说明：[docs/SCHEMAS.md](docs/SCHEMAS.md)
- 发布说明：[RELEASING.md](RELEASING.md)
- 更新日志：[CHANGELOG.md](CHANGELOG.md)
- English overview: [README.md](README.md)

## 快速命令

安装 Python 依赖：

```bash
python3 -m pip install -r requirements.txt
```

从本仓库根目录运行：

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

```bash
python3 knot/automation/scripts/run_preflight.py --knot-dir knot
```

```bash
./knot/core/knot.sh
```

如果当前目录是 `knot/` 框架目录内部，则去掉第一层 `knot/` 前缀：

```bash
cd knot

python3 automation/scripts/validate_schema.py \
  --schema automation/schemas/taskboard.schema.json \
  --input runtime/taskboard.json

python3 automation/scripts/run_preflight.py --knot-dir .
```

## 模板

模板是示例，不是 Knot 核心默认行为。

- `knot/examples/starter-empty/`：合法的空白起点，用于新内容工作流。
- `knot/examples/templates/seedance-short-drama/`：Seedance 短剧模板示例，不是 Knot 核心默认行为。它包含 30 集短剧工作流，用于生成导演分析、人物/场景提示词事实库和 Seedance 2.0 分镜提示词。

Seedance 模板包含 `knot/examples/templates/seedance-short-drama/knot-init/`，这是模板专用初始化器。通用 Knot 框架不假设剧集脚本、短剧阶段或 Seedance 提示词。

## Agent Skill

通用 runtime 初始化 skill 以源码形式放在 `skills/knot-runtime/`。这个目录随 Knot 发布，方便用户复制，但它本身通常不会被 Agent 自动加载。

需要让 Agent 准备或刷新 `knot/runtime/` 时，把它安装到宿主项目中：

- Codex 风格 Agent：`.agents/skills/knot-runtime/`
- Claude Code：`.claude/skills/knot-runtime/`

这个 skill 只应该生成或更新：

- `knot/runtime/project-brief.md`
- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

## 最小输入集

`Knot` 不依赖 PRD。

最小运行输入只有这 3 个：

- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

`knot/runtime/project-spec.json` 可以通过 AI 从 `knot/runtime/project-brief.md` 和项目扫描结果生成，也可以手写并按 schema 校验。
