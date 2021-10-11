import * as fs from "fs";
import { join } from "path";

const sizeMap: Map<string, number> = new Map();
export function getFolderSize(filePath: string, ignore: string[]): number {
  const contents = fs.readdirSync(filePath);
  let size: number = 0;
  let stats: fs.Stats;
  for (let content of contents) {
    const contentPath = join(filePath, content);
    stats = fs.statSync(contentPath);
    if (stats.isDirectory()) {
      if (!ignore.includes(content)) {
        if (sizeMap.has(contentPath)) size += sizeMap.get(contentPath);
        else size += getFolderSize(contentPath, ignore);
      }
    } else {
      size += stats.size;
    }
  }
  sizeMap.set(filePath, size);
  return size;
}
export function formatDate(date: Date) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  //@ts-ignore
  return date.toLocaleDateString("en-US", options);
}
export function removeDirectory(path: string) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path) || [];
    files.forEach(function (filename) {
      if (fs.statSync(path + "/" + filename).isDirectory()) {
        removeDirectory(path + "/" + filename);
      } else {
        fs.unlinkSync(path + "/" + filename);
      }
    });
  }
  if (process.cwd() !== path) {
    fs.rmdirSync(path);
  }
}
