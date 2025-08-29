import * as ReactDOM from "react-dom/client";
import { App } from "./components/App";
import { isInDocument } from "./utils/isInDocument";

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
