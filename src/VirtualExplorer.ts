import * as fs from "fs";
import * as path from "path";
import type { contentDescriptor } from "./types";

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
    const fullPath = this.getFullPath();
    return fs.existsSync(fullPath)
      ? [
          { name: "../", isDir: true },
          ...fs
            .readdirSync(fullPath)
            .filter((elem) => !this.ignore.includes(elem))
            .map((elem) => ({
              name: " ".repeat(paddingCount) + elem,
              isDir: fs.statSync(path.join(fullPath, elem)).isDirectory(),
            })),
        ]
      : [];
  }
  commitAction(actionDescriptor): {
    redraw: Boolean;
    contents: contentDescriptor[] | null;
  } {
    const pressedAtChild = actionDescriptor.name;
    const commandVerb = actionDescriptor.verb;
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
        if (commandVerb === "traverse") {
          this.dispatchAction({ command: "traverse", path: childPath });
        } else if (commandVerb === "display") {
          //Order of ctx and currContent important
          this.ctx = this.getFullPath();
          this.currContent = pressedAtChild;
          this.paddingCount = 0;
          return { redraw: true, contents: this.getChildren() };
        }
      } else {
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
