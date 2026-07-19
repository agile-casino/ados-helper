import * as SDK from "azure-devops-extension-sdk";
import * as ReactDOM from "react-dom/client";
import { ExtensionApp } from "./ExtensionApp";

async function main() {
  await SDK.init({ loaded: false });
  await SDK.ready();

  const container = document.getElementById("root");
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<ExtensionApp />);
  }
}

main().catch(err => {
  console.error("ADOS Extension boot failed:", err);
  SDK.notifyLoadFailed(err instanceof Error ? err : new Error(String(err)));
});
