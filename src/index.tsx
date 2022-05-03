import { render } from "react-dom";
import { App } from "./components/App";
import { isInDocument } from "./utils";

const container = document.createElement("div");
container.className = "flex";

render(<App />, container);

let url = window.location.href;
const urlChangeEvent = new Event("urlChange");

const observer = new MutationObserver((mutations: MutationRecord[]) => {
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
