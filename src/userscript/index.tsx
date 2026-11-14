import * as ReactDOM from "react-dom/client";
import { isInDocument } from "../shared/utils/isInDocument";
import { App } from "./App";
import { attachStyles } from "./shadowStyles";

// Render inside a shadow root so Azure DevOps' global styles cannot leak into our UI
// (and ours cannot leak out). `all: initial` stops inherited properties crossing the boundary.
const container = document.createElement("div");
// Mantine's baseline styles `body`, which doesn't exist in a shadow root, so set those on the host (inline, to beat `all: initial`).
container.style.cssText = "all: initial; display: flex; font-family: var(--mantine-font-family); font-size: var(--mantine-font-size-md); line-height: var(--mantine-line-height); color: var(--mantine-color-text);";

const shadowRoot = container.attachShadow({ mode: "open" });
attachStyles(shadowRoot);

const mountPoint = document.createElement("div");
shadowRoot.appendChild(mountPoint);

const root = ReactDOM.createRoot(mountPoint);
root.render(<App host={container} portalTarget={mountPoint} />);

let url = window.location.href;
const urlChangeEvent = new Event("urlChange");

const observer = new MutationObserver(() => {
  if (window.location.href !== url) {
    window.dispatchEvent(urlChangeEvent);
    url = window.location.href;
  }
  if (!isInDocument(container)) {
    const searchHeader = document.querySelector(".expandable-search-header");
    if (searchHeader) {
      searchHeader.parentElement?.insertBefore(container, searchHeader);
    }
  }
});

observer.observe(document.body, { subtree: true, characterData: true, childList: true });
