export type contentDescriptor = {
  name: string;
  isDir: Boolean;
  size: string;
  lastModified: string;
  meta: string;
  toPath: string;
  fullPath?: string;
};
export type configDescriptor = {
  flag: "filterExtensions" | "after" | "before" | "gitignore";
  value: string;
};
export interface config {
  ignores: string[];
  openTerminal:string;
  openFile:string;
}
export enum FlagTypes {
  FilterExtension = 0,
  Gitignore = 1,
  Before = 2,
  After = 3,
}
