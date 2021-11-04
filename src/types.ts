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
    | "regex"
    | "icons"
    | "find"
    | "ls";
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
  Before = 1,
  After = 2,
  Regex = 3,
  Icons = 4,
  Find = 5,
  LS = 6,
}
