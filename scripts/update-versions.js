const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");

// Read current version from package.json
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;

console.log(`Syncing version ${version} to other configuration files...`);

const filesToUpdate = ["src-tauri/tauri.conf.json", "vss-extension.json", "vss-extension-dev.json"];

// Helper to update version in a JSON file
function updateJsonVersion(relativeFilePath) {
  const filePath = path.join(rootDir, relativeFilePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found at ${filePath}`);
    return false;
  }
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  content.version = version;
  // Write back with trailing newline
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log(`Updated version in ${relativeFilePath}`);
  return true;
}

const updatedFiles = [];
for (const file of filesToUpdate) {
  if (updateJsonVersion(file)) {
    updatedFiles.push(file);
  }
}

if (updatedFiles.length > 0) {
  try {
    console.log("Formatting updated files with Biome...");
    execSync(`npx biome format --write ${updatedFiles.join(" ")}`, {
      cwd: rootDir,
      stdio: "inherit"
    });
  } catch (error) {
    console.warn("Warning: Failed to format files with Biome:", error.message);
  }
}

// Stage the updated files
try {
  console.log("Staging updated configuration files...");
  execSync(`git add ${updatedFiles.join(" ")}`, {
    cwd: rootDir,
    stdio: "inherit"
  });
} catch (error) {
  console.error("Failed to stage files with git:", error.message);
  process.exit(1);
}
