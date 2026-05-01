# Knot 操作手册

## 1. 文档目标

本文档说明如何在一个新的内容生产项目中使用 `Knot`。它覆盖：

- `Knot` 是什么
- 目录结构
- 初始化方式
- Schema 校验
- Preflight 预检
- 循环运行
- 常见排障入口

概念总览见 [README.md](../README.md)，数据结构见 [SCHEMAS.md](SCHEMAS.md)。

除非特别说明，本文中的长路径命令都从发行包根目录运行；短路径命令则从 `knot/` 框架目录内部运行。

## 2. Knot 是什么

`Knot` 是一个面向内容生产项目的自治循环框架。它适合需要“小任务拆分 + 审核门禁 + 可持续迭代”的内容工作流。

核心原则：

1. 一次迭代只处理 1 个 story。
2. 每次迭代都使用 fresh context。
3. 所有状态都通过文件持久化。
4. 完成标准不是“感觉差不多”，而是“通过门禁”。

默认闭环：

```text
produce -> validate -> review -> revise -> approve -> persist
```

## 3. 默认仓库状态

默认仓库运行态是一个通用 demo。真实项目应从 `knot/examples/starter-empty/` 复制起步，或选择 `knot/examples/templates/` 下的某个模板。

默认 `knot/runtime/` 的作用是展示模型，不代表任何特定业务：

- 2 个 story
- 一个 story 产出内容提纲
- 一个 story 依赖提纲产出文案草稿
- 每个 story 都有明确 inputs、outputs、dependencies、acceptance criteria 和 review gates

## 4. 核心目录结构

```text
package-root/
├── knot/
│   ├── core/
│   │   ├── CLAUDE.md
│   │   └── knot.sh
│   ├── automation/
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── tests/
│   ├── examples/
│   │   ├── starter-empty/
│   │   └── templates/
│   └── runtime/
│       ├── progress.txt
│       ├── project-brief.md
│       ├── project-spec.json
│       └── taskboard.json
├── docs/
├── skills/
│   └── knot-runtime/
├── README.md
└── requirements.txt
```

职责：

- `knot/core/`：执行核心，包括循环脚本和单轮执行 prompt。
- `knot/automation/`：schema、校验脚本、预检脚本与测试。
- `docs/`：项目文档。
- `knot/examples/starter-empty/`：新项目可复制的空白起点。
- `knot/examples/templates/`：领域模板示例。
- `skills/knot-runtime/`：随 Knot 发布的可选 Agent skill 源码。
- `knot/runtime/`：当前要运行的项目状态。

## 5. 运行前准备

建议具备：

- Python 3.11 或更高版本
- `jsonschema` Python 包
- `jq`
- 可用的 AI CLI 工具，例如 Claude Code 或 Amp

检查 Python：

```bash
python3 --version
```

检查 `jsonschema`：

```bash
python3 - <<'PY'
import importlib.util
print(importlib.util.find_spec("jsonschema") is not None)
PY
```

返回 `True` 说明依赖可用。

## 6. 初始化一个真实项目

### 6.1 推荐宿主项目结构

推荐把 Knot 放到内容项目根目录下的 `knot/` 子目录：

```text
my-content-project/
├── .agents/ 或 .claude/
├── knot/
├── config.json
├── script/
├── assets/
└── outputs/
```

宿主项目负责源材料和输出产物；`knot/runtime/` 负责当前任务板、项目规格和进度记忆。

### 6.2 安装 runtime 初始化 skill

`skills/knot-runtime/` 是随 Knot 发布的 skill 源码。它不会因为位于发行包里就自动生效，需要复制到 Agent 会加载的位置。

Codex 风格 Agent：

```bash
mkdir -p .agents/skills
cp -R /path/to/knot-package/skills/knot-runtime .agents/skills/knot-runtime
```

Claude Code：

```bash
mkdir -p .claude/skills
cp -R /path/to/knot-package/skills/knot-runtime .claude/skills/knot-runtime
```

安装后，可以让 Agent 根据宿主项目的 `script/`、`assets/`、`config.json`、业务说明和现有 runtime 生成或刷新：

- `knot/runtime/project-brief.md`
- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

### 6.3 从空白 starter 开始

复制 `knot/examples/starter-empty/` 到 `knot/runtime/`，然后改写这些文件：

- `knot/runtime/project-brief.md`
- `knot/runtime/project-spec.json`
- `knot/runtime/taskboard.json`
- `knot/runtime/progress.txt`

`knot/examples/starter-empty/taskboard.json` 包含 1 个合法占位 story，因为当前 schema 要求 `stories` 至少有 1 项。

### 6.4 从模板开始

可选模板位于 `knot/examples/templates/`。

例如 `knot/examples/templates/seedance-short-drama/` 是一个领域模板示例，不是 Knot 默认行为。它可以作为如何组织复杂内容流水线的参考。

### 6.5 生成 project spec

如果不想手写 `project-spec.json`，可以让 AI CLI 基于 brief 和项目扫描结果生成：

```bash
python3 knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --force
```

brief 优先级：

1. `--brief "..."`
2. `--brief-file path`
3. `knot/runtime/project-brief.md`

## 7. Schema 校验

如果 Knot 位于宿主项目的 `knot/` 子目录，从宿主项目根目录运行：

```bash
python3 knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

如果当前目录就是 `knot/` 框架目录，使用下面的短路径。

校验 taskboard：

```bash
python3 automation/scripts/validate_schema.py \
  --schema automation/schemas/taskboard.schema.json \
  --input runtime/taskboard.json
```

校验 project spec：

```bash
python3 automation/scripts/validate_schema.py \
  --schema automation/schemas/project-spec.schema.json \
  --input runtime/project-spec.json
```

退出码：

- `0`：合法
- `1`：schema 校验失败
- `2`：文件、JSON 解析或运行时错误

## 8. Preflight 预检

Preflight 会检查关键 runtime 文件，并写入：

- `knot/runtime/reviews/preflight/latest.json`
- `knot/runtime/progress.txt` 里的 `PRECHECK` 记录

运行：

```bash
python3 knot/automation/scripts/run_preflight.py --knot-dir knot
```

如果当前目录就是 `knot/` 框架目录：

```bash
python3 automation/scripts/run_preflight.py --knot-dir .
```

`knot/core/knot.sh` 会在进入循环前强制执行 preflight。preflight 失败时，循环不会启动。

## 9. 启动循环

```bash
./knot/core/knot.sh
```

如果当前目录就是 `knot/` 框架目录：

```bash
./core/knot.sh
```

指定工具和迭代次数：

```bash
./knot/core/knot.sh --tool amp 5
```

强制刷新 spec：

```bash
./knot/core/knot.sh --brief "Describe the content workflow here" --force-spec
```

循环每轮读取 `knot/core/CLAUDE.md`，选择一个可执行 story，生产产物，运行 gate，更新 taskboard 和 progress。所有 story 完成后，迭代输出 `<promise>COMPLETE</promise>`，循环退出。

## 10. 排障入口

- 循环不启动：看 `knot/runtime/reviews/preflight/latest.json`
- story 不推进：看 `knot/runtime/taskboard.json` 的 status、dependencies、notes
- spec 生成失败：看 `knot/automation/scripts/generate_project_spec.py` 和 `knot/core/PROJECT_SPEC_GENERATOR.md`
- schema 拒绝：看 `knot/automation/schemas/*.schema.json` 和 `knot/examples/starter-empty/`
- skill 没生效：确认已复制到 `.agents/skills/knot-runtime/` 或 `.claude/skills/knot-runtime/`
- 进度不清楚：看 `knot/runtime/progress.txt`

## 11. 关键约束

- 不要把模板当成核心默认行为。
- 不要把真实业务项目数据发布到默认 `knot/runtime/`。
- `progress.txt` 是追加式日志，不要整体重写生产项目里的进度历史。
- 修改数据结构时，同步更新 schema、examples、docs 和 tests。
