import { waitForElement } from "./utils";

async function init() {
    const searchHeader = await waitForElement(".expandable-search-header");

    const reportButtonContainer = document.createElement("div");
    reportButtonContainer.className = "flex";

    const reportButton = document.createElement("button");
    reportButton.innerText = "Generate Reports";
    reportButton.style.height = "32px";
    reportButton.style.margin = "auto 8px";
    reportButton.onclick = showModal;
    reportButtonContainer.appendChild(reportButton);

    searchHeader.parentElement?.insertBefore(reportButtonContainer, searchHeader);
};

function showModal() {
    alert("button clicked");
}

init();