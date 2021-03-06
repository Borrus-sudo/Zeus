type contentDescriptor = {
  name: string;
  isDir: boolean;
  size: string;
  lastModified: string;
  meta: string;
  toPath: string;
  fullPath?: string;
  created?: Date;
};

type flagDescriptor = {
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

interface config {
  ignores: string[];
  queryIgnores: string[];
  openFile: string | Object;
  icons: Object;
  labels: { name: string; matchers: string[] }[];
  getFileCommand: (str: string) => string;
  getIcons: (str: string, suffix: string) => string;
}

enum FlagTypes {
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

export { contentDescriptor, flagDescriptor, config, FlagTypes };