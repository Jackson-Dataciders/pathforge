import { THEMES } from "./themes.generated";

const themeIds = THEMES.map(({ id }) => id);

export function NoFlashScript() {
  const script = `try { var themes = ${JSON.stringify(themeIds)}; var stored = localStorage.getItem("pathforge.colorTheme"); document.documentElement.dataset.colorTheme = themes.includes(stored) ? stored : "default"; } catch { document.documentElement.dataset.colorTheme = "default"; }`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}