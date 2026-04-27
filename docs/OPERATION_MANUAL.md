# Knot 操作手册

## 1. 文档目标

本文档用于说明如何在一个新的内容生产项目中使用 `Knot`。它覆盖以下内容：

- `Knot` 是什么
- 目录结构说明
- 初始化步骤
- Schema 校验方式
- Preflight 预检方式
- 循环运行方式
- 常见问题与排障建议

如果你想先了解概念，请优先阅读 [README.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/README.md:1)。
如果你想了解数据结构，请阅读 [SCHEMAS.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/docs/SCHEMAS.md:1)。

## 2. Knot 是什么

`Knot` 是一个面向内容生产项目的自治循环框架。它适合这类任务：

- 短剧、脚本、提纲、分镜、提示词生成
- 图文内容、营销素材、播客稿、课程内容生产
- 需要「小任务拆分 + 审核门禁 + 可持续迭代」的内容工作流

`Knot` 的核心原则有 4 个：

1. 一次迭代只处理 1 个 story。
2. 每次迭代都使用 fresh context。
3. 所有状态都通过文件持久化。
4. 完成标准不是“感觉差不多”，而是“通过门禁”。

## 3. 核心目录结构

一个标准的 `Knot` 目录通常包含以下内容：

```text
knot/
├── README.md
├── README.zh-CN.md
├── core/
│   ├── CLAUDE.md
│   └── knot.sh
├── docs/
│   ├── OPERATION_MANUAL.md
│   └── SCHEMAS.md
├── examples/
│   ├── project-spec.example.json
│   ├── taskboard.json.example
│   ├── review-result.example.json
│   └── preflight-report.example.json
├── runtime/
│   ├── progress.txt
│   ├── project-brief.md
│   ├── taskboard.json
│   └── reviews/
├── automation/
│   ├── schemas/
│   ├── scripts/
│   ├── skills/
│   └── tests/
```

各目录职责如下：

- `core/`：执行核心，包括单轮提示词和循环脚本。
- `docs/`：项目文档。
- `examples/`：样板输入输出。
- `runtime/`：当前实例运行态文件。
- `automation/`：Schema、脚本、测试与技能。

说明：

- 当前项目已移除 `prd` skill，`Knot` 直接围绕 `runtime/project-spec.json` 和 `runtime/taskboard.json` 工作。
- 如果别的项目仍需要前置需求整理，建议在项目外部完成，再导入到 `Knot` 的数据结构中。

## 4. 运行前准备

### 4.1 环境要求

建议具备以下环境：

- Python 3.11 或更高版本
- `jsonschema` Python 包
- `jq`
- 可用的 AI CLI 工具，例如 Claude Code 或 Amp

你可以先检查 Python 版本：

```bash
python --version
```

如果需要确认 `jsonschema` 可用，可以执行：

```bash
python - <<'PY'
import importlib.util
print(importlib.util.find_spec("jsonschema") is not None)
PY
```

返回 `True` 说明依赖已经可用。

### 4.2 拷贝 Knot 到项目

如果你要在别的项目中使用 `Knot`，建议将整个 `knot/` 目录复制到目标项目根目录，然后基于该目录做初始化配置。

初始化时最少需要准备：

- `runtime/taskboard.json`
- `runtime/project-brief.md` 或运行时 `--brief`
- `runtime/project-spec.json` 可以由 AI 自动生成，或由你手动提供

## 5. 初始化步骤

### 5.1 准备项目需求，而不是手写 `project-spec.json`

默认推荐写：

- [`runtime/project-brief.md`](/d:/dev/aigcFile/ai_shot_team_seedance/knot/runtime/project-brief.md:1)

你只需要写清楚：

- 这个项目要产出什么
- 目标受众是谁
- 风格、语气、视觉方向是什么
- 有哪些平台、品牌或合规约束
- AI 生成 `project-spec.json` 时需要特别注意什么

如果你不想写文件，也可以在运行命令时使用 `--brief "..."` 直接传入。

随后由 AI CLI 自动扫描项目并生成：

- `runtime/project-spec.generated.json`
- 需要时写入 `runtime/project-spec.json`

如果你仍然想手动提供正式 spec，也可以参考 [project-spec.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/project-spec.example.json:1)。

### 5.2 准备 `taskboard.json`

从 [taskboard.json.example](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/taskboard.json.example:1) 复制并改造，保存为 `runtime/taskboard.json`。

每个 story 都应该满足：

- 有唯一 `id`
- 有清晰 `title`
- 有明确 `inputs`
- 有明确 `outputs`
- 有依赖关系 `dependencies`
- 有门禁定义 `review_policy.required_gates`

建议把 story 拆到“一个迭代能完成”的粒度，不要把多个阶段塞进一个 story。

### 5.3 确认 `progress.txt`

`runtime/progress.txt` 不需要复杂初始化，但建议保留顶部的 `Workflow Patterns` 区块。

这个文件用于记录：

- 通用工作规律
- 每轮执行结果
- 失败原因
- 下轮注意事项

## 6. Schema 校验

### 6.1 为什么先做 Schema 校验

`Knot` 的很多问题不是“模型不会做”，而是“输入文件不合法”。因此在真正进入循环之前，先做 Schema 校验非常重要。

### 6.2 校验 `taskboard.json`

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

成功时会输出：

```text
VALID: ...\knot\taskboard.json
```

### 6.3 校验 `project-spec.json`

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/project-spec.schema.json \
  --input knot/runtime/project-spec.json
```

### 6.4 校验 review 结果

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/review-result.schema.json \
  --input knot/examples/review-result.example.json
```

### 6.5 校验 preflight 报告

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/preflight-report.schema.json \
  --input knot/examples/preflight-report.example.json
```

## 7. Preflight 预检

### 7.1 Preflight 的作用

`Preflight` 用于在正式循环启动前检查关键输入文件是否有效。它当前会做两类检查：

- `runtime/taskboard.json` 是否通过 `taskboard.schema.json`
- 如果存在 `runtime/project-spec.json`，它是否通过 `project-spec.schema.json`

### 7.2 生成 `project-spec.json`

独立生成草稿：

```bash
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude
```

直接写入正式文件：

```bash
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --force
```

命令行传入需求：

```bash
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --brief "把这个项目整理成一个中文短剧提示词生产流水线" --force
```

生成器会优先使用：

1. `--brief`
2. `--brief-file`
3. `runtime/project-brief.md`

同时自动扫描项目上下文，例如：

- `.claude/CLAUDE.md`
- `config.json`
- `script/`
- `assets/`
- `outputs/`
- `runtime/taskboard.json`

### 7.3 手动运行 Preflight

```bash
python knot/automation/scripts/run_preflight.py --knot-dir knot
```

成功时输出类似：

```text
PRECHECK PASS: ...\knot\runtime\reviews\preflight\latest.json
```

失败时输出类似：

```text
PRECHECK FAIL: ...\knot\runtime\reviews\preflight\latest.json
```

### 7.4 Preflight 的产物

运行后会生成两个结果：

1. `runtime/reviews/preflight/latest.json`
   结构化预检报告。

2. `runtime/progress.txt`
   新增一条 `PRECHECK` 日志。

例如：

```text
## [2026-04-24T03:00:25.596892+00:00] - PRECHECK
- Status: pass
- Checks:
  - taskboard: pass
- Report: runtime/reviews/preflight/latest.json
---
```

## 8. 正式运行 Knot

### 8.1 运行方式

默认运行方式：

```bash
./knot/core/knot.sh
```

运行时直接传 brief：

```bash
./knot/core/knot.sh --brief "把这个项目做成一个中文短剧 Seedance 提示词流水线"
```

指定最大轮数：

```bash
./knot/core/knot.sh 5
```

指定工具：

```bash
./knot/core/knot.sh --tool claude 5
./knot/core/knot.sh --tool amp 5
```

强制重新生成正式 spec：

```bash
./knot/core/knot.sh --force-spec --tool claude 5
```

### 8.2 `knot.sh` 启动时会做什么

启动时，`knot.sh` 会先执行：

1. 检查 `runtime/taskboard.json` 是否存在。
2. 检查校验脚本和 schema 是否存在。
3. 如果 `runtime/project-spec.json` 不存在，或显式传入 `--force-spec`，先调用 AI 生成器。
4. 调用 `run_preflight.py`。
5. 如果预检失败，立即退出。
6. 如果预检通过，再进入循环执行。

也就是说，现在 `Knot` 已经把 Schema 校验变成了真正的运行门禁。

### 8.3 单轮执行的基本逻辑

每轮大致会做这些事情：

1. 读取 `runtime/taskboard.json`
2. 选出一个可执行 story
3. 读取 `runtime/progress.txt` 与输入文件
4. 生成或修订目标内容
5. 跑结构与审核门禁
6. 更新状态
7. 写回进度
8. 退出，等待下一轮 fresh context

## 9. 常用操作清单

### 9.1 检查任务板是否健康

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

### 9.2 检查项目规范是否健康

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/project-spec.schema.json \
  --input knot/runtime/project-spec.json
```

### 9.3 手动执行预检

```bash
python knot/automation/scripts/run_preflight.py --knot-dir knot
```

### 9.4 手动生成项目规范

```bash
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --force
```

### 9.5 查看最近一次预检结果

```bash
cat knot/runtime/reviews/preflight/latest.json
```

### 9.6 查看进度日志

```bash
cat knot/runtime/progress.txt
```

## 10. 推荐工作流

如果你是第一次在新项目中落地 `Knot`，推荐按这个顺序操作：

1. 复制 `knot/` 目录到项目中。
2. 创建真实的 `runtime/taskboard.json`。
3. 填写 `runtime/project-brief.md`。
4. 先手动生成一次 `runtime/project-spec.json`。
5. 再手动运行 Schema 校验。
6. 手动运行一次 `run_preflight.py`。
7. 确认 `runtime/reviews/preflight/latest.json` 和 `runtime/progress.txt` 都正确更新。
8. 再运行 `core/knot.sh`。

这样做的好处是，先把静态输入问题清掉，再进入自治循环，排障会简单很多。

## 11. 常见问题

### 11.1 `runtime/taskboard.json` 合法，但运行还是失败

先检查两类问题：

- 文件路径虽然语法合法，但引用的输入文件并不存在
- 下游运行工具本身不可用，例如 AI CLI 没有配置好

Schema 只能保证“结构正确”，不能保证“业务上一定可执行”。

### 11.2 为什么 `runtime/project-spec.json` 是可选但建议存在

因为很多内容项目如果没有项目级约束，story 执行时会逐轮漂移。`runtime/project-spec.json` 的价值在于提供稳定的：

- 风格约束
- 语言约束
- 目标媒介约束
- 审核策略

现在它默认可以由 AI 自动生成，所以更推荐你维护的是 `runtime/project-brief.md`，而不是手写完整 spec。

### 11.3 为什么还要 `runtime/progress.txt`

因为 `runtime/taskboard.json` 只适合保存状态，不适合保存每轮的过程性信息。

`runtime/progress.txt` 更适合记录：

- 为什么失败
- 本轮做了什么
- 哪些规律值得后续复用
- 哪些坑以后别再踩

### 11.4 `core/knot.sh` 无法运行怎么办

如果你所在环境没有可用的 Bash，可能需要：

- 改用可用的 shell 环境运行
- 或者后续补一版 PowerShell 启动脚本

当前这份 `Knot` 主要假设存在一个可运行的 Bash 环境。

## 12. 排障建议

出现问题时，建议按下面顺序排查：

1. 先看 `runtime/taskboard.json` 是否能通过 schema 校验。
2. 再看 `runtime/project-spec.json` 是否能通过 schema 校验。
3. 再手动运行一次 `run_preflight.py`。
4. 查看 `runtime/reviews/preflight/latest.json`。
5. 查看 `runtime/progress.txt`。
6. 最后再看具体执行工具或 prompt 层的问题。

这个顺序能最大限度减少“问题还没定位，就开始怀疑整个系统”的情况。

## 13. 相关文档

- [README.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/README.md:1)
- [SCHEMAS.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/docs/SCHEMAS.md:1)
- [CLAUDE.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/core/CLAUDE.md:1)
- [PROJECT_SPEC_GENERATOR.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/core/PROJECT_SPEC_GENERATOR.md:1)
- [taskboard.json.example](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/taskboard.json.example:1)
- [project-spec.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/project-spec.example.json:1)
- [project-brief.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/runtime/project-brief.md:1)
- [review-result.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/review-result.example.json:1)
- [preflight-report.example.json](/d:/dev/aigcFile/ai_shot_team_seedance/knot/examples/preflight-report.example.json:1)
