import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import fileQuery from "./fileQuery";
import argv from "./flagParser";
import { config, contentDescriptor, flagDescriptor, FlagTypes } from "./types";
import {
  constructDescriptor,
  formatDate,
  getGlobalIgnores,
  getMetaDetails,
  rmDir
} from "./utils";
import copydir = require("copy-dir");
import clipboard = require("clipboardy");
export default class {
  private flagList: flagDescriptor[] = argv;
  private globalIgnores: string[] = [
    ...(this.flagList[FlagTypes.GIgnore]
      ? this.flagList[FlagTypes.GIgnore].value.split(",")
      : []),
    ...getGlobalIgnores(),
  ];
  private ctx: string;
  private currContent: string;
  readonly Config: config;
  readonly openTerminal: string;
  constructor(ctx: string, currContent: string, Config: config) {
    this.globalIgnores.push(...Config.ignores);
    this.ctx = ctx;
    this.currContent = currContent;
    this.Config = Config;
    if (!fs.existsSync(this.getFullPath())) {
      throw new Error(`Error: The path ${this.getFullPath()} does not exist.`);
    }
  }
  getFullPath(): string {
    return path.resolve(this.ctx, this.currContent);
  }
  async getChildren(): Promise<contentDescriptor[]> {
    const fullPath: string = this.getFullPath();
    const exists = fs.existsSync(fullPath);
    const fullPathStats: fs.Stats = exists ? fs.statSync(fullPath) : null;
    if (exists) {
      const filteredFiles = await Promise.all(
        [...fs.readdirSync(fullPath)]
          .filter(
            (elem) =>
              this.globalIgnores.indexOf(elem) == -1 &&
              this.globalIgnores.indexOf(path.join(fullPath, elem)) == -1
          )
          .map((elem) => constructDescriptor(path.join(fullPath, elem)))
      );
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
        ...filteredFiles,
      ];
      return await fileQuery.filter(this.flagList, files);
    } else return [];
  }
  async commitAction(actionDescriptor): Promise<{
    redraw: Boolean;
    contents: contentDescriptor[] | null;
  }> {
    let contents: contentDescriptor[] = [];
    switch (actionDescriptor.verb) {
      case "submit":
        if (actionDescriptor.isDir) {
          const folderName = actionDescriptor.name;
          this.ctx = path.join(folderName, "../");
          this.currContent = path.basename(folderName);
        } else {
          exec(this.Config.getFileCommand(actionDescriptor.name));
        }
        contents = await this.getChildren();
        return { redraw: true, contents };
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
          exec(this.Config.getFileCommand(actionDescriptor.name));
        }
        break;
      case "delete":
        if (actionDescriptor.isDir) {
          rmDir(actionDescriptor.name);
        } else {
          fs.unlinkSync(actionDescriptor.name);
        }
        contents = await this.getChildren();
        return {
          redraw: true,
          contents,
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
        contents = await this.getChildren();
        return { redraw: true, contents };
    }
    return { redraw: false, contents: null };
  }
}
