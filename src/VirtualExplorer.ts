import * as fs from "fs";
import * as path from "path";
import type { contentDescriptor } from "./types";
import { formatDate, getFolderSize } from "./utils";

export default class {
  private ignore: string[] = ["node_modules", ".git"];
  private paddingCount: number = 0;
  private ctx: string;
  private currContent: string;
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
                isDir: isDir,
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
    const pressedAtChild = actionDescriptor.name;
    const userActionTo = actionDescriptor.verb;
    if (pressedAtChild === "../") {
      // Order of currContent and ctx important
      this.currContent = path.basename(path.resolve(this.getFullPath(), "../"));
      this.ctx = path.resolve(this.ctx, "../");
      this.paddingCount = 0;
      return {
        redraw: true,
        contents: this.getChildren(),
      };
    } else {
      const childPath = path.resolve(this.getFullPath(), "./" + pressedAtChild);
      if (fs.statSync(childPath).isDirectory()) {
        if (userActionTo === "traverse") {
          this.dispatchAction({ command: "traverse", path: childPath });
        } else if (userActionTo === "display") {
          //Order of ctx and currContent important
          this.ctx = this.getFullPath();
          this.currContent = pressedAtChild;
          this.paddingCount = 0;
          return { redraw: true, contents: this.getChildren() };
        }
      } else {
        // for files the user option traverse is not possible
        this.dispatchAction({ command: "open", path: childPath });
      }
    }
    return {
      redraw: false,
      contents: null,
    };
  }
  private dispatchAction(commandDescriptor) {}
}
