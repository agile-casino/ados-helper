import workItemTableCss from "../shared/components/WorkItemTable.module.css?inline";
import mantineCss from "../shared/styles/mantine.css?inline";

/**
 * Adds our stylesheets to the shadow root. They are imported as strings (`?inline`) so Vite does
 * not also append them to document.head, which is exactly where Azure DevOps' styles live.
 * Any new CSS file used by the userscript UI must be added here.
 */
export const attachStyles = (shadowRoot: ShadowRoot) => {
  for (const css of [mantineCss, workItemTableCss]) {
    const style = document.createElement("style");
    style.textContent = css;
    shadowRoot.appendChild(style);
  }
};
