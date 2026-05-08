# Knot Workbench

Knot Workbench 是一个基于 Tauri 2、React 和 Rust 的桌面应用，用来准备、审查、保存并运行宿主项目里的 Knot runtime。

## 当前能力

- 选择宿主项目文件夹，检测 `knot/` 与运行时状态
- 复制内置 Knot 模板，保护已有生产运行时
- 调用本机 `claude` / `amp` 生成运行时草案并写入暂存区
- 编辑 `project-brief.md`、`project-spec.json`、`taskboard.json`
- 执行运行时校验与原子保存
- 运行 preflight 与 `knot/core/knot.sh`，查看实时日志
- 浏览产物、审核文件和 `progress.txt` 时间线

## 本地开发

前提：

- Node.js 20+
- `pnpm`
- Rust toolchain
- macOS 下已安装 Xcode Command Line Tools

启动开发环境：

```bash
cd /Users/zm/工作/dev/myProject/knot/workbench
pnpm install
pnpm tauri dev
```

默认会启动 Vite 开发服务器，并由 Tauri 打开桌面窗口。

## 测试与构建

```bash
cd /Users/zm/工作/dev/myProject/knot/workbench
pnpm lint
pnpm test -- --run
pnpm build

cd /Users/zm/工作/dev/myProject/knot/workbench/src-tauri
cargo test
```

打包桌面应用：

```bash
cd /Users/zm/工作/dev/myProject/knot/workbench
pnpm tauri build
```

构建产物默认输出到：

- 前端静态文件：`/Users/zm/工作/dev/myProject/knot/workbench/dist`
- 桌面 bundle：`/Users/zm/工作/dev/myProject/knot/workbench/src-tauri/target/release/bundle/macos`

## 目录说明

- `src/`：React 界面、状态和前端测试
- `src-tauri/src/`：Rust 命令层、进程管理、文件读写
- `src-tauri/resources/`：内置 Knot 模板与提示词
- `src-tauri/tests/`：Rust 集成测试
- `docs/manual-test-checklist.md`：手动验收清单

## 打包备注

- `src-tauri/tauri.conf.json` 已启用 bundle，并包含 Knot 模板资源
- `pnpm tauri build` 默认生成可运行的 macOS `.app` bundle
- macOS bundle 目前设置 `minimumSystemVersion` 为 `12.0`
- 如需签名、公证或 App Store 配置，可继续扩展 `bundle.macOS`
