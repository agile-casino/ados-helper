import { render } from "preact";
import { App } from "./components/App";
import { waitForElement } from "./utils";

async function init() {
    const searchHeader = await waitForElement(".expandable-search-header");

    const container = document.createElement("div");
    container.className = "flex";
    render(<App />, container);

    searchHeader.parentElement?.insertBefore(container, searchHeader);
};

init();