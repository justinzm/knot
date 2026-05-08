import { Moon, Sun } from "lucide-react";
import { SegmentedControl } from "../ui/SegmentedControl";
import { IconButton } from "../ui/IconButton";
import "./TopStatusBar.css";

export type ThemeMode = "dark" | "light";

interface TopStatusBarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export function TopStatusBar({ theme, onThemeChange }: TopStatusBarProps) {
  return (
    <header className="top-status-bar">
      <div className="status-items" aria-label="项目状态">
        <span>项目：未选择</span>
        <span>运行时：未加载</span>
        <span>AI CLI：未检测</span>
        <span>预检：未运行</span>
        <span>运行：空闲</span>
      </div>
      <div className="topbar-actions">
        <SegmentedControl
          label="主题"
          value={theme}
          options={[
            { value: "dark", label: "暗色" },
            { value: "light", label: "浅色" },
          ]}
          onChange={onThemeChange}
        />
        <IconButton
          icon={theme === "dark" ? Moon : Sun}
          label={theme === "dark" ? "当前暗色主题" : "当前浅色主题"}
        />
      </div>
    </header>
  );
}
