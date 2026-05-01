# Seedance Short-Drama Init Skill

> This initializer belongs to the Seedance short-drama template. The generic Knot framework does not assume episode scripts, Seedance prompts, or short-drama production stages.

一键初始化 Seedance 短剧 Knot 内容生产项目的运行时配置。

## 快速开始

```bash
# 进入项目根目录，确保 knot/ 已复制到此

# 一键初始化（清理旧状态 + 生成新配置）
python examples/templates/seedance-short-drama/knot-init/init_project.py --knot-dir knot --clean

# 启动 Knot 循环
./knot/core/knot.sh --tool claude
```

## 前置要求

- Python 3.11+
- `jsonschema` Python 包
- 可用的 AI CLI 工具（Claude Code 或 Amp）
- 项目根目录有 `config.json`（推荐）和 `script/` 目录

## 生成内容

运行后，`knot/runtime/` 下会生成：

| 文件 | 来源 |
|------|------|
| `project-brief.md` | 基于 `config.json` 和 `script/` 扫描自动生成 |
| `taskboard.json` | 基于集数和阶段规则自动生成 |
| `progress.txt` | 固定模板 |
| `project-spec.json` | 调用官方 `generate_project_spec.py` 生成 |

## 常见问题

**Q: 已有旧项目数据，会冲突吗？**

使用 `--clean` 参数会自动清理旧运行时文件。`outputs/` 和 `assets/` 中的产物不会被删除。

**Q: 剧本文件名不标准怎么办？**

脚本支持多种命名格式（Episode-01、ep01、第1集等）。如果仍无法识别，需要手动编写 taskboard。

**Q: 生成的 taskboard 需要手动修改吗？**

通常不需要。但如果项目有特殊的阶段需求或依赖关系，可以手动编辑生成的 `taskboard.json`。

**Q: 可以只生成部分文件吗？**

可以。去掉 `--clean` 即可增量更新。使用 `--skip-spec` 可跳过 spec 生成。
