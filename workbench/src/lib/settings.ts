import type { AppSettings } from "./tauri/commands";

export const defaultSettings: AppSettings = {
  default_cli: "claude",
  max_iterations: 10,
  scan_exclusions: [".git", "node_modules", "knot/runtime/archive"],
  theme: "dark",
  template_source: "bundled",
  recent_projects: [],
};

export function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    default_cli: settings.default_cli === "amp" ? "amp" : "claude",
    max_iterations: Math.min(Math.max(settings.max_iterations, 1), 50),
    theme: settings.theme === "light" ? "light" : "dark",
    scan_exclusions: settings.scan_exclusions
      .map((item) => item.trim())
      .filter(Boolean),
  };
}
