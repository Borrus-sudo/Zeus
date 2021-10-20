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

export function getTerminalDefaults() {
  switch (process.platform) {
    case "win32":
      return "start cmd.exe /K pushd ${PATH}";
    default:
      return "open -a Terminal ${PATH}";
  }
}

export function getFileDefaults() {
  switch (process.platform) {
    case "win32":
      return "notepad ${PATH}";
    default:
      "";
  }
}

export function isProject(): [(content: string) => void, () => string[]] {
  let nodeProjects = ["node_modules", "package.json"];
  let rustProjects = [];
  return [
    (content: string) => {
      if (nodeProjects.includes(content))
        nodeProjects.splice(nodeProjects.indexOf(content), 1);
      if (rustProjects.includes(content))
        rustProjects.splice(rustProjects.indexOf(content), 1);
    },
    () => {
      const isTheFollowingProjects = [];
      if (nodeProjects.length === 0) {
        isTheFollowingProjects.push("node");
      }
      if (rustProjects.length === 0) {
        isTheFollowingProjects.push("rust");
      }
      return isTheFollowingProjects;
    },
  ];
}

export function findProjectDepth(
  folderPath: string,
  ...projects: string[]
): boolean {
  const contents = fs.readdirSync(folderPath);
  const [addFile, getProjectsLabels] = isProject();
  const dirs = [];
  for (let content of contents) {
    const contentPath = path.join(folderPath, content);
    addFile(content);
    if (fs.statSync(contentPath).isDirectory()) {
      dirs.push(contentPath);
    }
  }
  const projectLabels = getProjectsLabels();
  const res = projects.some(
    (item: string) => projectLabels.indexOf(item) !== 0
  );
  if (res) {
    return true;
  } else {
    for (let dir of dirs) {
      const res = findProjectDepth(dir, ...projects);
      if (res) {
        return true;
      }
    }
  }
  return false;
}
