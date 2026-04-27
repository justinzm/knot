# Knot

`Knot` 是一个面向内容生产工作流的自治循环框架。

它适合这类项目：任务必须拆小、每轮上下文有限、产物需要明确审核门禁，而且流程会持续很多轮。

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

默认闭环是：

`produce -> validate -> review -> revise -> approve -> persist`

## 适用场景

- 剧本、提纲、分镜、提示词流水线
- 图文、营销素材、播客稿、课程内容生产
- 世界观、设定集、长期内容资产维护
- 任何需要“小任务拆分 + 审核门禁 + 多轮迭代”的内容项目

如果一个项目完全没有审核边界，只是开放式头脑风暴，那它就不是 `Knot` 最擅长的场景。

## 目录结构

- `core/`
  运行入口，例如 `knot.sh` 和单轮执行 prompt。
- `automation/`
  Schema、校验脚本、测试和可选 skill。
- `runtime/`
  当前项目正在使用的任务板、进度日志和审核结果。
- `examples/`
  新项目可复制的样板文件。
- `docs/`
  详细操作手册和 Schema 说明。
- `skills/`
  可选辅助 skill，例如 `knot-init`，用于一键初始化项目运行时。

## 从哪里开始

1. 准备真实的 `runtime/taskboard.json`
2. 在 `runtime/project-brief.md` 里写需求，或运行时通过 `--brief` 传入
3. 运行预检，或让 `knot.sh` 自动生成 `runtime/project-spec.json`
4. 启动 `core/knot.sh`

推荐入口：

- 详细操作手册：[OPERATION_MANUAL.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/docs/OPERATION_MANUAL.md:1)
- Schema 说明：[SCHEMAS.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/docs/SCHEMAS.md:1)
- 发布说明：[RELEASING.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/RELEASING.md:1)
- 更新日志：[CHANGELOG.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/CHANGELOG.md:1)
- English overview: [README.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/README.md:1)

## 快速命令

```bash
python knot/automation/scripts/generate_project_spec.py --knot-dir knot --tool claude --force
```

```bash
python knot/automation/scripts/validate_schema.py \
  --schema knot/automation/schemas/taskboard.schema.json \
  --input knot/runtime/taskboard.json
```

```bash
python knot/automation/scripts/run_preflight.py --knot-dir knot
```

```bash
./knot/core/knot.sh
```

```bash
./knot/core/knot.sh --brief "把这个项目做成一个中文短剧 Seedance 提示词流水线"
```

## Skills（可选辅助）

`skills/` 目录用来存放可选的辅助 skill。它们不是 Knot 必需的运行组件，但能显著简化常见的初始化和维护流程。

### knot-init —— 一键初始化项目

`skills/knot-init/init_project.py` 会自动扫描宿主项目（`config.json`、`script/`、已有产物），并生成完整的 runtime 配置，让你从空仓库到可运行的 Knot 循环只需要一条命令。

它会生成：

| 文件 | 来源 |
|------|------|
| `runtime/project-brief.md` | 基于 `config.json` 和 `script/` 扫描自动生成 |
| `runtime/taskboard.json` | 基于检测到的集数和阶段规则自动生成 |
| `runtime/progress.txt` | 从固定模板初始化 |
| `runtime/project-spec.json` | 自动调用官方的 `automation/scripts/generate_project_spec.py` 生成 |

推荐工作流：

```bash
# 1. 清理旧运行时并重新生成全部配置
python skills/knot-init/init_project.py --knot-dir knot --clean --tool claude

# 2. 预检通过后启动 Knot 循环
./knot/core/knot.sh --tool claude
```

常用参数：

| 参数 | 说明 |
|------|------|
| `--knot-dir` | **必填**。Knot 目录路径 |
| `--project-root` | 项目根目录。默认是 `--knot-dir` 的父目录 |
| `--clean` | 清理旧 runtime 文件（`taskboard.json`、`progress.txt` 等）。`outputs/` 和 `assets/` 中的产物不会被删除 |
| `--skip-spec` | 跳过 `project-spec.json` 生成 |
| `--tool` | AI CLI 工具（`claude` 或 `amp`）。默认 `claude` |
| `--dry-run` | 演示模式，不实际写入文件 |
| `--max-episodes` | 最大集数限制。默认 50 |

集数命名支持 `Episode-01.md`、`ep01-xxx.md`、`第1集-xxx.md`、`EP01.md` 等多种格式。每集默认展开成 3 个有依赖的 story：`DIR`（导演分析）→ `ART`（服化道设计）→ `SB`（分镜提示词）。集与集之间无依赖，可并行处理。

完整 skill 文档见 [skills/knot-init/SKILL.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/skills/knot-init/SKILL.md:1) 与 [skills/knot-init/README.md](/d:/dev/aigcFile/ai_shot_team_seedance/knot/skills/knot-init/README.md:1)。

## 最小输入集

`Knot` 不依赖 `prd`。

最小运行输入只有这 3 个：

- `runtime/project-spec.json`
- `runtime/taskboard.json`
- `runtime/progress.txt`

其中 `runtime/project-spec.json` 现在可以通过 AI 自动生成：输入来自 `runtime/project-brief.md` 和项目扫描结果。
