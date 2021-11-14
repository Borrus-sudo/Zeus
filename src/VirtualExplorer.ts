import { exec } from "child_process";
import { promises as fs, Stats } from "fs";
import * as path from "path";
import fileQuery from "./fileQuery";
import argv from "./flagParser";
import { config, contentDescriptor, flagDescriptor, FlagTypes } from "./types";
import {
  constructDescriptor,
  existsAsync,
  formatDate,
  getGlobalIgnores,
  getMetaDetails,
  rmDir,
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
  constructor(ctx: string, currContent: string, Config: config) {
    this.globalIgnores.push(...Config.ignores);
    this.ctx = ctx;
    this.currContent = currContent;
    this.Config = Config;
  }

  getFullPath(): string {
    return path.resolve(this.ctx, this.currContent);
  }

  async getChildren(): Promise<contentDescriptor[]> {
    const fullPath: string = this.getFullPath();
    const exists = await existsAsync(fullPath);
    const fullPathStats: Stats = exists ? await fs.stat(fullPath) : null;

    if (exists) {
      const filteredFiles = await Promise.all(
        [...(await fs.readdir(fullPath))]
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
              await clipboard.write(`pushd ${actionDescriptor.name}&cls`);
              break;
            default:
              await clipboard.write(`cd ${actionDescriptor.name}&clear`);
          }
          process.exit();
        } else {
          exec(this.Config.getFileCommand(actionDescriptor.name));
        }
        break;

      case "delete":
        if (actionDescriptor.isDir) {
          await rmDir(actionDescriptor.name);
        } else {
          await fs.unlink(actionDescriptor.name);
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

          while (await existsAsync(path.join(toLocation, destinationName))) {
            destinationName =
              (counter > 1 ? destinationName.replace(/\d+$/, "") : folderName) +
              counter;
            counter++;
          }

          const toPath = path.join(toLocation, destinationName);
          await copydir(actionDescriptor.from, toPath, {
            utimes: true,
            mode: true,
            cover: true,
          });

          if (actionDescriptor.verb === "cut") {
            await rmDir(actionDescriptor.from);
          }
        } else {
          const from = actionDescriptor.from; // full filePath to copy
          const toFolderLocation = actionDescriptor.to;
          let counter = 1;
          let { name, ext } = path.parse(from);

          // Choose the file name such that it does not exist
          while (await existsAsync(path.join(toFolderLocation, name + ext))) {
            name = (counter > 1 ? name.replace(/\d+$/, "") : name) + counter;
            counter++;
          }

          const to = path.join(toFolderLocation, name + ext);
          await fs.copyFile(from, to);
          if (actionDescriptor.verb === "cut") {
            await fs.unlink(from);
          }
        }

        contents = await this.getChildren();
        return { redraw: true, contents };
    }
    return { redraw: false, contents: null };
  }
}
