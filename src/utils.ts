import * as fs from "fs";
import { promises as fsP } from "fs";
import { join } from "path";
import Config from "./resolveConfig";
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
export async function existsInDepth(
  folderPath: string,
  askedForLabels: string[],
  descriptor: {
    before: undefined | Date;
    after: undefined | Date;
    regex: RegExp | undefined;
  }
): Promise<boolean> {
  const contents = await fsP.readdir(folderPath, { withFileTypes: true });
  const [addFile, getProjectsLabels] = isProject(
    askedForLabels.indexOf("git") != -1
  );
  const dirs = [];
  for (let content of contents) {
    const contentPath = path.join(folderPath, content.name);
    addFile(content.name);
    if (
      content.isDirectory() &&
      !queryIgnores.includes(path.basename(contentPath))
    ) {
      dirs.push(contentPath);
    }
  }
  const gotLabels = getProjectsLabels();
  const res = askedForLabels.some(
    (item: string) => gotLabels.indexOf(item) !== -1
  );
  const stat = await fsP.stat(folderPath);
  const created = stat.birthtime;
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
    const responses = await Promise.all(
      dirs.map((dir) => existsInDepth(dir, askedForLabels, descriptor))
    );
    return responses.some((elem) => elem === true);
  }
}
