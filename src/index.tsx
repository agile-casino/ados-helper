import { render } from "preact";
import { App } from "./components/App";
import { isInDocument } from "./utils";

const container = document.createElement("div");
container.className = "flex";

render(<App />, container);

const observer = new MutationObserver((mutations: MutationRecord[]) => {
    if (!isInDocument(container)) {
        const searchHeader = document.querySelector(".expandable-search-header");
        if (searchHeader) {
            searchHeader.parentElement?.insertBefore(container, searchHeader);
        }
    }
});

observer.observe(document.body, { subtree: true, characterData: true, childList: true });
