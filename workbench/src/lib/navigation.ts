import {
  Boxes,
  ClipboardCheck,
  FolderCog,
  Gauge,
  GitBranch,
  PackageOpen,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

export type NavId =
  | "overview"
  | "prepare"
  | "runtime"
  | "workflow"
  | "preflight"
  | "run"
  | "artifacts";

export interface NavigationItem {
  id: NavId;
  label: string;
  description: string;
  icon: LucideIcon;
  inspectorTitle: string;
  inspectorSummary: string;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "overview",
    label: "总览",
    description: "查看运行时就绪度、内容单元分布、预检状态和下一步动作。",
    icon: Gauge,
    inspectorTitle: "总览检查器",
    inspectorSummary: "未选择项目时显示全局准备状态；后续会展示当前项目摘要。",
  },
  {
    id: "prepare",
    label: "准备项目",
    description: "选择宿主项目、检测 Knot、处理运行时和配置生成前设置。",
    icon: FolderCog,
    inspectorTitle: "准备项目检查器",
    inspectorSummary: "后续显示目录检测、AI CLI 可用性和覆盖风险。",
  },
  {
    id: "runtime",
    label: "运行时",
    description: "审查和编辑项目简报、项目规格以及运行时保存状态。",
    icon: Boxes,
    inspectorTitle: "运行时检查器",
    inspectorSummary: "后续显示 brief、spec 字段校验和保存快照。",
  },
  {
    id: "workflow",
    label: "工作流",
    description: "查看内容单元依赖、任务板、门禁规则和右侧详情。",
    icon: GitBranch,
    inspectorTitle: "工作流检查器",
    inspectorSummary: "后续显示选中内容单元的输入、输出、依赖和门禁。",
  },
  {
    id: "preflight",
    label: "预检",
    description: "运行 schema、路径和依赖检查，定位阻塞项。",
    icon: ClipboardCheck,
    inspectorTitle: "预检检查器",
    inspectorSummary: "后续显示 latest.json、失败字段和修复入口。",
  },
  {
    id: "run",
    label: "运行",
    description: "手动启动或停止 Knot 循环，并查看实时日志。",
    icon: PlayCircle,
    inspectorTitle: "运行检查器",
    inspectorSummary: "后续显示迭代次数、当前内容单元和完成信号。",
  },
  {
    id: "artifacts",
    label: "产物",
    description: "浏览产物、审核与进度时间线。",
    icon: PackageOpen,
    inspectorTitle: "产物检查器",
    inspectorSummary: "后续显示文件元数据、审核状态和预览摘要。",
  },
];

export function findNavigationItem(id: NavId): NavigationItem {
  return navigationItems.find((item) => item.id === id) ?? navigationItems[0];
}
