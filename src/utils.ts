import * as fs from "fs";
import { join } from "path";
import path = require("path");

export function getMetaDetails(stats: fs.Stats) {
  let stat = "";
  stat += stats["mode"] & 1 ? "x" : "-";
  stat += stats["mode"] & 2 ? "w" : "-";
  stat += stats["mode"] & 4 ? "r" : "-";
  stat += stats["mode"] & 10 ? "x" : "-";
  stat += stats["mode"] & 20 ? "w" : "-";
  stat += stats["mode"] & 40 ? "r" : "-";
  stat += stats["mode"] & 100 ? "x" : "-";
  stat += stats["mode"] & 200 ? "w" : "-";
  stat += stats["mode"] & 400 ? "r" : "-";
  return stat;
}
export function formatDate(date: Date) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  } as const;
  return date.toLocaleDateString("en-US", options);
}
export function rmDir(path: string) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path) || [];
    files.forEach(function (fileName) {
      if (fs.statSync(join(path, fileName)).isDirectory()) {
        rmDir(join(path, fileName));
      } else {
        fs.unlinkSync(join(path, fileName));
      }
    });
  }
  fs.rmdirSync(path);
}

export function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export function getFileDefaults() {
  switch (process.platform) {
    case "win32":
      return "notepad ${PATH}";
    default:
      "";
  }
}

export function isProject(
  isGit: boolean
): [(content: string) => void, () => string[]] {
  let nodeProjects = ["package.json"];
  let rustProjects = ["Cargo.toml"];
  if (isGit) {
    nodeProjects.push(".git");
    rustProjects.push(".git");
  }
  return [
    (content: string) => {
      if (nodeProjects.includes(content))
        nodeProjects.splice(nodeProjects.indexOf(content), 1);
      if (rustProjects.includes(content))
        rustProjects.splice(rustProjects.indexOf(content), 1);
    },
    () => {
      const isTheFollowingProjects = [];
      if (nodeProjects.length === 0) isTheFollowingProjects.push("node");
      if (rustProjects.length === 0) isTheFollowingProjects.push("rust");
      return isTheFollowingProjects;
    },
  ];
}

export const queryIgnores = ["$RECYCLE.BIN", "node_modules", ".git"];
export const matchingProjectLinks: string[] = [];
export function existsInDepth(
  folderPath: string,
  askedForLabels: string[]
): boolean {
  const contents = fs.readdirSync(folderPath);
  const [addFile, getProjectsLabels] = isProject(
    askedForLabels.includes("git")
  );
  const dirs = [];
  for (let content of contents) {
    const contentPath = path.join(folderPath, content);
    addFile(content);
    if (fs.statSync(contentPath).isDirectory()) {
      dirs.push(contentPath);
    }
  }
  const gotLabels = getProjectsLabels();
  const res = askedForLabels.some(
    (item: string) => gotLabels.indexOf(item) !== -1
  );
  if (res) {
    matchingProjectLinks.push(folderPath);
    return true;
  } else {
    for (let dir of dirs) {
      if (!queryIgnores.includes(path.basename(dir))) {
        const res = existsInDepth(dir, askedForLabels);
        if (res) {
          matchingProjectLinks.push(dir);
          return true;
        }
      }
    }
    return false;
  }
}
