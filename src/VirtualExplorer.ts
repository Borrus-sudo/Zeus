import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import argv from "./config";
import type { configDescriptor, contentDescriptor } from "./types";
import { formatDate, getFolderSize, rmDir } from "./utils";
const copydir = require("copy-dir");
export default class {
  private ignore: string[] = [
    "node_modules",
    ".git",
    "System Volume Information",
  ];
  private paddingCount: number = 0;
  private ctx: string;
  private currContent: string;
  private config: configDescriptor[] = argv();
  constructor(ctx: string, currContent: string, ignore: string[]) {
    this.ignore.push(...ignore);
    this.ctx = ctx;
    this.currContent = currContent;
    if (!fs.existsSync(this.getFullPath())) {
      throw new Error(`Error: The path ${this.getFullPath()} does not exist.`);
    }
  }
  getFullPath(): string {
    return path.resolve(this.ctx, this.currContent);
  }
  getChildren() {
    return this.toStringDir(this.paddingCount + 2);
  }
  toStringDir(paddingCount: number): contentDescriptor[] {
    let stats: fs.Stats;
    let isDir: boolean;
    let size: number;
    const fullPath: string = this.getFullPath();
    return fs.existsSync(fullPath)
      ? [
          { name: "../", isDir: true, size: "", lastModified: "" },
          ...fs
            .readdirSync(fullPath)
            .filter((elem) => !this.ignore.includes(elem))
            .map((elem) => {
              stats = fs.statSync(path.join(fullPath, elem));
              isDir = stats.isDirectory();
              size = isDir
                ? getFolderSize(path.join(fullPath, elem), this.ignore)
                : stats.size;
              return {
                name: " ".repeat(paddingCount) + (isDir ? elem + "/" : elem),
                isDir,
                size: size.toString() + "B",
                lastModified: formatDate(stats.mtime),
              };
            }),
        ]
      : [];
  }
  commitAction(actionDescriptor): {
    redraw: Boolean;
    contents: contentDescriptor[] | null;
  } {
    switch (actionDescriptor.verb) {
      case "submit":
        if (actionDescriptor.isDir) {
          const folderName = actionDescriptor.name;
          this.ctx = path.join(folderName, "../");
          this.currContent = path.basename(folderName);
          this.paddingCount = 0;
        } else {
          this.dispatchAction({
            command: "openFile",
            path: actionDescriptor.name,
          });
        }
        return { redraw: true, contents: this.getChildren() };
      case "open":
        if (actionDescriptor.isDir) {
        } else {
          this.dispatchAction({
            command: "openFile",
            path: actionDescriptor.name,
          });
        }
        break;
      case "delete":
        if (actionDescriptor.isDir) {
          rmDir(actionDescriptor.name);
        } else {
          fs.unlinkSync(actionDescriptor.name);
        }
        return {
          redraw: true,
          contents: this.getChildren(),
        };
      default:
        if (actionDescriptor.isDir) {
          const toLocation = actionDescriptor.to;
          const folderName = path.basename(actionDescriptor.from);
          let destinationName = folderName;
          let counter = 1;
          while (fs.existsSync(path.join(toLocation, folderName))) {
            destinationName =
              (counter > 1 ? folderName.slice(0, -1) : folderName) + counter;
            counter++;
          }
          const toPath = path.join(toLocation, destinationName);
          copydir.sync(actionDescriptor.from, toPath, {
            utimes: true,
            mode: true,
            cover: true,
          });
          if (actionDescriptor.verb === "cut") {
            rmDir(actionDescriptor.from);
          }
        } else {
          const from = actionDescriptor.from; // full filePath to copy
          const toFolderLocation = actionDescriptor.to;
          let counter = 1;
          let { name, ext, base: destinationName } = path.parse(from);
          // Choose the file name such that it does not exist
          while (fs.existsSync(path.join(toFolderLocation, destinationName))) {
            destinationName =
              (counter > 1 ? name.slice(0, -1) : name) + counter + ext;
            counter++;
          }
          const to = path.join(toFolderLocation, destinationName);
          fs.copyFileSync(from, to);
          if (actionDescriptor.verb === "cut") {
            fs.unlinkSync(from);
          }
        }
        return { redraw: true, contents: this.getChildren() };
    }
    return { redraw: false, contents: null };
  }
  private dispatchAction(commandDescriptor) {
    switch (commandDescriptor.command) {
      case "openFile":
        execSync(`code ${commandDescriptor.path}`);
        break;
      case "openFolder":
        break;
    }
  }
}
