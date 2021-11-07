export type contentDescriptor = {
  name: string;
  isDir: boolean;
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
    | "ls"
    | "queryIgnore"
    | "globalIgnore";
  value: string;
};
export interface config {
  ignores: string[];
  queryIgnores: string[];
  openFile: string | Object;
  icons: Object;
  getFileCommand: (str: string) => string;
  getIcons: (str: string, suffix: string) => string;
}
export enum FlagTypes {
  FilterExtension = 0,
  Before = 1,
  After = 2,
  Regex = 3,
  Icons = 4,
  Find = 5,
  LS = 6,
  QIgnore = 7,
  GIgnore = 8,
}
