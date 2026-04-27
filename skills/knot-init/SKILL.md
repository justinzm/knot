---
name: knot-init
description: Knot 项目初始化 Skill。扫描项目结构，自动生成运行时所需的全部配置文件，支持清理旧项目状态。
---

# Knot Init Skill

## 功能

自动完成 Knot 项目的初始化工作：

1. **清理旧状态**（可选）— 删除上一轮项目的运行时文件
2. **扫描项目结构** — 读取 `config.json`、`script/` 目录、已有产物
3. **生成 `project-brief.md`** — 基于扫描结果自动填充项目需求
4. **生成 `taskboard.json`** — 基于集数和阶段规则自动生成全部 story
5. **生成 `progress.txt`** — 初始化空进度日志
6. **生成 `project-spec.json`** — 调用官方 AI 生成器
7. **运行预检验证** — 确保生成物符合 schema

## 使用方式

### 基本用法

```bash
python skills/knot-init/init_project.py --knot-dir knot
```

### 完整流程（推荐）

```bash
# 1. 清理旧运行时并重新初始化
python skills/knot-init/init_project.py \
  --knot-dir knot \
  --clean \
  --tool claude

# 2. 预检通过后即可启动 Knot
./knot/core/knot.sh --tool claude
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `--knot-dir` | **必填**。Knot 目录路径 |
| `--project-root` | 项目根目录。默认是 knot-dir 的父目录 |
| `--clean` | 清理已有的运行时文件（`taskboard.json`、`progress.txt` 等） |
| `--skip-spec` | 跳过 `project-spec.json` 生成 |
| `--tool` | AI CLI 工具（`claude` 或 `amp`）。默认 `claude` |
| `--dry-run` | 演示模式，不实际写入文件 |
| `--max-episodes` | 最大集数限制。默认 50 |

### 演示模式

```bash
python skills/knot-init/init_project.py \
  --knot-dir knot \
  --clean \
  --dry-run
```

## 自动检测逻辑

### 集数识别

脚本自动扫描 `script/` 目录，支持以下命名格式：

| 格式 | 示例 |
|------|------|
| `Episode-01.md` | ✅ 识别为第 1 集 |
| `ep01-xxx.md` | ✅ 识别为第 1 集 |
| `第1集-xxx.md` | ✅ 识别为第 1 集 |
| `EP01.md` | ✅ 识别为第 1 集 |

### 阶段定义

默认每集生成 3 个 story：

| Story ID | 阶段 | 产物 |
|----------|------|------|
| `EP01-DIR` | 导演分析 | `outputs/ep01/01-director-analysis.md` |
| `EP01-ART` | 服化道设计 | `assets/character-prompts.json`, `assets/scene-prompts.json` |
| `EP01-SB` | 分镜编写 | `outputs/ep01/02-seedance-prompts.json` |

### 依赖关系

```
EP01-DIR → EP01-ART → EP01-SB
EP02-DIR → EP02-ART → EP02-SB
...
```

集与集之间**无依赖**，可并行处理。

## 扩展：自定义阶段

修改 `init_project.py` 中的 `STAGE_DEFINITIONS` 列表，即可自定义阶段：

```python
STAGE_DEFINITIONS = [
    {
        "stage_id": "your-stage",
        "short": "YS",
        "title_prefix": "你的阶段",
        "agent": "your-agent",
        "outputs": ["outputs/{episode}/your-output.md"],
    },
]
```

## 与 Producer Pipeline 的区别

| | Producer Pipeline (根工作流) | Knot Init + Knot Loop |
|---|---|---|
| 触发方式 | 人工指令 `~start` / `~design` / `~prompt` | 全自动循环 |
| 初始化 | 手动准备各阶段输入 | `init_project.py` 一键生成 |
| 审核 | 导演两步审核（业务+合规） | Story 级门禁审核 |
| 适用场景 | 精细化人工干预 | 批量自动化处理 |

## 注意事项

1. **如果 `config.json` 缺失关键字段**（`visual_style`、`target_medium`），脚本会生成带占位符的 brief 并提示用户补充
2. **如果 `script/` 目录为空**，taskboard 将为空，需要手动编写
3. **清理操作不可逆**，`--clean` 会删除旧 runtime 文件但不会删除 `outputs/` 和 `assets/` 中的产物
4. **预检失败时的处理**：根据错误信息修正 `taskboard.json` 或补充 `config.json`
