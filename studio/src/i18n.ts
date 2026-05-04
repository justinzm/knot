import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const languageStorageKey = "knot-studio-language";
export type StudioLanguage = "zh" | "en";

export const languageOptions: Array<{ value: StudioLanguage; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

const resources = {
  zh: {
    translation: {
      app: {
        noProjectSelected: "未选择项目",
        status: {
          idle: "空闲",
          runtimeLoaded: "runtime 已加载",
        },
        runtimeMissing: "请先在设置中打开 runtime。",
        runtimeLoadedFallback: "Runtime 已加载。",
      },
      nav: {
        overview: "总览",
        brief: "项目简报",
        spec: "项目规格",
        workflow: "工作流搭建器",
        taskboard: "任务板",
        gates: "规则门禁",
        validation: "校验中心",
        run: "运行控制台",
        outputs: "输出",
        settings: "设置",
      },
      settings: {
        title: "打开本地 Knot 项目",
        language: "界面语言",
        projectPath: "项目文件夹路径",
        opening: "打开中...",
        openRuntime: "打开 runtime",
      },
      brief: {
        title: "项目简报",
        markdown: "简报 Markdown",
        saving: "保存中...",
        save: "保存简报",
      },
      spec: {
        title: "项目规格",
        unavailable: "项目规格草稿不可用。",
        projectId: "项目 ID",
        projectType: "项目类型",
        targetMedium: "目标媒介",
        language: "内容语言",
        audience: "受众",
        stages: "阶段，逗号分隔",
        saving: "保存中...",
        save: "保存规格",
      },
      taskboard: {
        title: "任务板",
        noStories: "任务板中没有故事。",
        validation: "校验",
        noIssues: "没有客户端问题。",
        dependencyCycle: "依赖循环",
        saving: "保存中...",
        save: "保存任务板",
      },
      storyInspector: {
        title: "故事检查器",
        storyTitle: "标题",
        stage: "阶段",
        status: "状态",
        priority: "优先级",
        inputs: "输入，每行一个",
        outputs: "输出，每行一个",
        requiredGates: "必需门禁",
      },
      validation: {
        title: "校验中心",
        noIssues: "没有客户端校验问题。",
        dependencyCycle: "依赖循环",
        missingDependency: "缺失依赖",
      },
      workflow: {
        title: "工作流搭建器",
        noStories: "没有故事",
        dependencyCycle: "依赖循环",
        missingDependencies: "缺失依赖",
        dependencies: "依赖",
      },
      gates: {
        title: "规则门禁",
        noStories: "没有故事",
        blocking: "阻塞",
        nonBlocking: "非阻塞",
      },
      run: {
        title: "运行控制台",
        tool: "AI 工具",
        runningPreflight: "Preflight 运行中...",
        runPreflight: "运行 preflight",
        runningLoop: "Loop 运行中...",
        startLoop: "启动 loop",
        statusLabel: "运行状态：",
        running: "正在运行 {{command}}",
        idle: "空闲",
        noCommand: "尚未运行命令。",
        empty: "（空）",
      },
      outputs: {
        title: "输出",
        description: "浏览生成输出、评审报告和进度日志。",
        refreshing: "刷新中...",
        refresh: "刷新",
        artifacts: "产物",
        none: "未找到产物。",
        missing: "缺失",
        empty: "（空）",
        select: "请选择一个产物进行预览。",
      },
    },
  },
  en: {
    translation: {
      app: {
        noProjectSelected: "No project selected",
        status: {
          idle: "idle",
          runtimeLoaded: "runtime loaded",
        },
        runtimeMissing: "Open a runtime from Settings.",
        runtimeLoadedFallback: "Runtime is loaded.",
      },
      nav: {
        overview: "Overview",
        brief: "Project Brief",
        spec: "Project Spec",
        workflow: "Workflow Builder",
        taskboard: "Taskboard",
        gates: "Gate Rules",
        validation: "Validation Center",
        run: "Run Console",
        outputs: "Outputs",
        settings: "Settings",
      },
      settings: {
        title: "Open Local Knot Project",
        language: "Interface language",
        projectPath: "Project folder path",
        opening: "Opening...",
        openRuntime: "Open runtime",
      },
      brief: {
        title: "Project Brief",
        markdown: "Brief markdown",
        saving: "Saving...",
        save: "Save brief",
      },
      spec: {
        title: "Project Spec",
        unavailable: "Project spec draft is unavailable.",
        projectId: "Project id",
        projectType: "Project type",
        targetMedium: "Target medium",
        language: "Language",
        audience: "Audience",
        stages: "Stages, comma-separated",
        saving: "Saving...",
        save: "Save spec",
      },
      taskboard: {
        title: "Taskboard",
        noStories: "No stories in taskboard.",
        validation: "Validation",
        noIssues: "No client-side issues.",
        dependencyCycle: "dependency cycle",
        saving: "Saving...",
        save: "Save taskboard",
      },
      storyInspector: {
        title: "Story Inspector",
        storyTitle: "Title",
        stage: "Stage",
        status: "Status",
        priority: "Priority",
        inputs: "Inputs, one per line",
        outputs: "Outputs, one per line",
        requiredGates: "Required gates",
      },
      validation: {
        title: "Validation Center",
        noIssues: "No client-side validation issues.",
        dependencyCycle: "dependency cycle",
        missingDependency: "missing dependency",
      },
      workflow: {
        title: "Workflow Builder",
        noStories: "No stories found",
        dependencyCycle: "Dependency cycle",
        missingDependencies: "Missing Dependencies",
        dependencies: "Dependencies",
      },
      gates: {
        title: "Gate Rules",
        noStories: "No stories found",
        blocking: "blocking",
        nonBlocking: "non-blocking",
      },
      run: {
        title: "Run Console",
        tool: "AI tool",
        runningPreflight: "Running preflight...",
        runPreflight: "Run preflight",
        runningLoop: "Running loop...",
        startLoop: "Start loop",
        statusLabel: "Run status:",
        running: "running {{command}}",
        idle: "idle",
        noCommand: "No command has run yet.",
        empty: "(empty)",
      },
      outputs: {
        title: "Outputs",
        description: "Browse generated outputs, review reports, and progress logs.",
        refreshing: "Refreshing...",
        refresh: "Refresh",
        artifacts: "Artifacts",
        none: "No artifacts found.",
        missing: "missing",
        empty: "(empty)",
        select: "Select an artifact to preview it.",
      },
    },
  },
};

function getInitialLanguage(): StudioLanguage {
  return window.localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
