import { execSync, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import argv from "./flagParser";
import { configDescriptor, contentDescriptor } from "./types";
import { formatDate, getMetaDetails, rmDir } from "./utils";
const copydir = require("copy-dir");
const prettyBytes = require("pretty-bytes");
export default class {
  private globalIgnores: string[] = ["System Volume Information"];
  private ctx: string;
  private currContent: string;
  private config: configDescriptor[] = argv();
  readonly openFile: string;
  readonly openTerminal: string;
  constructor(
    ctx: string,
    currContent: string,
    ignore: string[],
    [openFile, openTerminal]
  ) {
    this.globalIgnores.push(...ignore);
    this.ctx = ctx;
    this.currContent = currContent;
    this.openFile = openFile;
    this.openTerminal = openTerminal;
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
      //globalIgnores+ .gitignore of the present dir
      const files = [...fs.readdirSync(fullPath)];
      let contentPath = "";
      return [
        {
          name: "../",
          isDir: true,
          size: "",
          lastModified: formatDate(fullPathStats.mtime),
          meta: getMetaDetails(fullPathStats),
          toPath: path.join(fullPath, "../"),
          fullPath,
        },
        ...files
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
              };
            }
          }),
      ];
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
          execSync(this.openFile.replace("${PATH}", actionDescriptor.name));
        }
        return { redraw: true, contents: this.getChildren() };
      case "open":
        if (actionDescriptor.isDir) {
          exec(this.openTerminal.replace("${PATH}", actionDescriptor.name));
        } else {
          execSync(this.openFile.replace("${PATH}", actionDescriptor.name));
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
}
