import * as fs from "fs";
import * as path from "path";
import type { contentDescriptor } from "./types";

export default class {
  private ignore: string[] = ["node_modules", ".git"];
  private paddingCountHist: number[] = [0];
  private ctx: string;
  private currContent: string;
  constructor(ctx: string, ignore: string[], currContent: string) {
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
    return this.toStringDir(this.paddingCountHist.at(-1) + 2);
  }
  toStringDir(paddingCount: number): contentDescriptor[] {
    this.paddingCountHist.push(paddingCount);
    return fs.existsSync(this.getFullPath())
      ? fs
          .readdirSync(this.getFullPath())
          .filter((elem) => !this.ignore.includes(elem))
          .map((elem) => ({
            name: " ".repeat(paddingCount) + elem,
            isDir: fs.statSync(elem).isDirectory(),
          }))
      : [];
  }
  commitAction(actionDescriptor): {
    redraw: Boolean;
    contents: contentDescriptor[] | null;
  } {
    const pressedAtChild = actionDescriptor.name;
    if (pressedAtChild === "../") {
      this.ctx = path.resolve(this.ctx, "../");
      this.currContent = path.resolve(this.currContent, "../");
      this.paddingCountHist = [0];
      return {
        redraw: true,
        contents: this.getChildren(),
      };
    } else {
      const childPath = path.resolve(this.getFullPath(), "./" + pressedAtChild);
      if (fs.statSync(childPath).isDirectory()) {
        this.dispatchAction({ command: "traverse", path: childPath });
      } else {
        this.dispatchAction({ command: "open", path: childPath });
      }
    }
    return {
      redraw: false,
      contents: null,
    };
  }
  dispatchAction(commandDescriptor) {}
}
