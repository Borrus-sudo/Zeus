import * as fs from "fs";
import { join } from "path";
import path = require("path");
import Config from "./resolveConfig";
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

export function getGlobalIgnores(): string[] {
  switch (process.platform) {
    case "win32":
      return ["System Volume Information"];
    default:
      return [".Trash"];
  }
}

function getQueryIgnores(): string[] {
  const queryIgnores = ["node_modules", ".git"];
  switch (process.platform) {
    case "win32":
      return ["$RECYCLE.BIN", "System Volume Information", ...queryIgnores];
    default:
      return [".Trash", ...queryIgnores];
  }
}

export function getFileDefaults(): string {
  switch (process.platform) {
    case "win32":
      return "notepad ${PATH}";
    case "darwin":
      return "open ${PATH}";
    default:
      return "cat ${PATH}";
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
      if (nodeProjects.indexOf(content) != -1)
        nodeProjects.splice(nodeProjects.indexOf(content), 1);
      if (rustProjects.indexOf(content) != -1)
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
export const queryIgnores = [...Config.queryIgnores, ...getQueryIgnores()];
export const cache: string[] = [];
export function existsInDepth(
  folderPath: string,
  askedForLabels: string[],
  descriptor: {
    before: undefined | Date;
    after: undefined | Date;
    regex: RegExp | undefined;
  }
): boolean {
  const contents = fs.readdirSync(folderPath);
  const [addFile, getProjectsLabels] = isProject(
    askedForLabels.indexOf("git") != -1
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
  const created = fs.statSync(folderPath).birthtime;
  const inTimeLimit = descriptor.before
    ? descriptor.before > created
    : true && descriptor.after
    ? descriptor.after < created
    : true;
  const matchesRegex = descriptor.regex
    ? descriptor.regex.test(path.basename(folderPath))
    : true;
  if (res && inTimeLimit && matchesRegex) {
    if (cache.indexOf(folderPath) == -1) cache.push(folderPath);
    return true;
  } else {
    for (let dir of dirs) {
      if (queryIgnores.indexOf(path.basename(dir)) == -1) {
        const res = existsInDepth(dir, askedForLabels, descriptor);
        const created = fs.statSync(dir).birthtime;
        const inTimeLimit = descriptor.before
          ? descriptor.before > created
          : true && descriptor.after
          ? descriptor.after < created
          : true;
        const matchesRegex = descriptor.regex
          ? descriptor.regex.test(path.basename(dir))
          : true;
        if (res && inTimeLimit && matchesRegex) {
          return true;
        }
      }
    }
    return false;
  }
}
