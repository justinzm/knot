import { useState } from "react";
import { useTranslation } from "react-i18next";

import { languageOptions, languageStorageKey, type StudioLanguage } from "../i18n";
import { normalizeUnknownError } from "../lib/errors";
import { openProjectFolder } from "../lib/knot/dialog";
import { openRuntime } from "../lib/knot/tauri";
import type { RuntimeSnapshot } from "../lib/knot/types";

interface SettingsProps {
  onRuntimeLoaded: (snapshot: RuntimeSnapshot) => void;
}

export function Settings({ onRuntimeLoaded }: SettingsProps) {
  const { i18n, t } = useTranslation();
  const [projectRoot, setProjectRoot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [choosingFolder, setChoosingFolder] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleOpenRuntime() {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await openRuntime(projectRoot);
      onRuntimeLoaded(snapshot);
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function handleLanguageChange(language: StudioLanguage) {
    window.localStorage.setItem(languageStorageKey, language);
    await i18n.changeLanguage(language);
  }

  async function handleChooseFolder() {
    setChoosingFolder(true);
    setError(null);
    try {
      const selected = await openProjectFolder(t("settings.selectProjectFolderTitle"));
      if (selected) {
        setProjectRoot(selected);
      }
    } catch (caught) {
      setError(normalizeUnknownError(caught));
    } finally {
      setChoosingFolder(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t("settings.title")}</h2>
      <label className="field">
        <span>{t("settings.language")}</span>
        <select
          value={i18n.resolvedLanguage === "en" ? "en" : "zh"}
          onChange={(event) => void handleLanguageChange(event.target.value as StudioLanguage)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t("settings.projectPath")}</span>
        <div className="path-picker">
          <input
            value={projectRoot}
            onChange={(event) => setProjectRoot(event.target.value)}
            placeholder="/Users/example/my-content-project"
          />
          <button className="secondary-button" disabled={choosingFolder || loading} onClick={handleChooseFolder}>
            {choosingFolder ? t("settings.choosingFolder") : t("settings.chooseFolder")}
          </button>
        </div>
      </label>
      <button className="primary-button" disabled={!projectRoot || loading} onClick={handleOpenRuntime}>
        {loading ? t("settings.opening") : t("settings.openRuntime")}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
