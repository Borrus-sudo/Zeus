import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import fileQuery from "./fileQuery";
import argv from "./flagParser";
import { configDescriptor, contentDescriptor } from "./types";
import { formatDate, getMetaDetails, rmDir } from "./utils";
import copydir = require("copy-dir");
import prettyBytes = require("pretty-bytes");
import clipboard = require("clipboardy");
export default class {
  private globalIgnores: string[] = ["System Volume Information"];
  private ctx: string;
  private currContent: string;
  private config: configDescriptor[] = argv();
  readonly openFile: string;
  readonly openTerminal: string;
  constructor(ctx: string, currContent: string, ignore: string[], openFile) {
    this.globalIgnores.push(...ignore);
    this.ctx = ctx;
    this.currContent = currContent;
    this.openFile = openFile;
    if (!fs.existsSync(this.getFullPath())) {
      throw new Error(`Error: The path ${this.getFullPath()} does not exist.`);
    }
  }
  getFullPath(): string {
    return path.resolve(this.ctx, this.currContent);
  }
  getChildren(): contentDescriptor[] {
    let stats: fs.Stats;
    let isDir: boolean;
    const fullPath: string = this.getFullPath();
    const exists = fs.existsSync(fullPath);
    const fullPathStats: fs.Stats = exists ? fs.statSync(fullPath) : null;
    if (exists) {
      let contentPath = "";
      const files = [
        {
          name: "../",
          isDir: true,
          size: "",
          lastModified: formatDate(fullPathStats.mtime),
          meta: getMetaDetails(fullPathStats),
          toPath: path.join(fullPath, "../"),
          fullPath,
        },
        ...[...fs.readdirSync(fullPath)]
          .filter((elem) => !this.globalIgnores.includes(elem))
          .map((elem) => {
            contentPath = path.join(fullPath, elem);
            stats = fs.lstatSync(contentPath);
            if (!stats.isSymbolicLink()) {
              isDir = stats.isDirectory();
              return {
                name: isDir ? elem + "/" : elem,
                isDir,
                size: isDir ? "" : prettyBytes(stats.size),
                lastModified: formatDate(stats.mtime),
                meta: getMetaDetails(stats),
                toPath: path.join(fullPath, elem),
                created: stats.birthtime,
              };
            } else {
              const target = path.resolve(
                path.dirname(contentPath),
                path.normalize(fs.readlinkSync(contentPath))
              );
              return {
                name: `${path.basename(contentPath)} -> ${path.basename(
                  target
                )}`,
                isDir: stats.isDirectory(),
                size: prettyBytes(stats.size),
                lastModified: formatDate(stats.mtime),
                meta: getMetaDetails(stats),
                toPath: target,
                created: stats.birthtime,
              };
            }
          }),
      ];
      return [...fileQuery.filter(this.config, files)];
    } else return [];
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
        } else {
          exec(this.openFile.replace("${PATH}", actionDescriptor.name));
        }
        return { redraw: true, contents: this.getChildren() };
      case "open":
        if (actionDescriptor.isDir) {
          switch (process.platform) {
            case "win32":
              clipboard.writeSync(`pushd ${actionDescriptor.name}&cls`);
              break;
            default:
              clipboard.writeSync(`cd ${actionDescriptor.name}&cls`);
              "";
          }
          process.exit();
        } else {
          exec(this.openFile.replace("${PATH}", actionDescriptor.name));
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
          while (fs.existsSync(path.join(toLocation, destinationName))) {
            destinationName =
              (counter > 1 ? destinationName.replace(/\d+$/, "") : folderName) +
              counter;
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
          let { name, ext } = path.parse(from);
          // Choose the file name such that it does not exist
          while (fs.existsSync(path.join(toFolderLocation, name + ext))) {
            name = (counter > 1 ? name.replace(/\d+$/, "") : name) + counter;
            counter++;
          }
          const to = path.join(toFolderLocation, name + ext);
          fs.copyFileSync(from, to);
          if (actionDescriptor.verb === "cut") {
            fs.unlinkSync(from);
          }
        }
        return { redraw: true, contents: this.getChildren() };
    }
    return { redraw: false, contents: null };
  }
}
