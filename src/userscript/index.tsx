import * as ReactDOM from "react-dom/client";
import { isInDocument } from "../shared/utils/isInDocument";
import { App } from "./App";
// @ts-expect-error Mantine styles CSS module
import "../shared/styles/mantine.css";

const container = document.createElement("div");
container.className = "flex";

const root = ReactDOM.createRoot(container);
root.render(<App />);

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
