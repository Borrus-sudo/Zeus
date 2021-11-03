export type contentDescriptor = {
  name: string;
  isDir: Boolean;
  size: string;
  lastModified: string;
  meta: string;
  toPath: string;
  fullPath?: string;
  created?: Date;
};
export type flagDescriptor = {
  flag:
    | "filterExtensions"
    | "after"
    | "before"
    | "gitignore"
    | "regex"
    | "icons"
    | "find";
  value: string;
};
export interface config {
  ignores: string[];
  queryIgnores: string[];
  openFile: string | Object;
  getFileCommand: (str: string) => string;
}
export enum FlagTypes {
  FilterExtension = 0,
  Gitignore = 1,
  Before = 2,
  After = 3,
  Regex = 4,
  Icons = 5,
  Find = 6,
}
