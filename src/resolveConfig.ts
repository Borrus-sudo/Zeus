import * as fs from "fs";
import * as path from "path";
import { config } from "./types";
const dotFileLocation = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  ".zeus.json"
);
function getFileDefaults(): string {
  switch (process.platform) {
    case "win32":
      return "notepad ${PATH}";
    case "darwin":
      return "open ${PATH}";
    default:
      return "cat ${PATH}";
  }
}
function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
let options: Omit<config, "getFileCommand"> = {
  ignores: [],
  queryIgnores: [],
  openFile: getFileDefaults(),
};
if (!fs.existsSync(dotFileLocation)) {
  fs.writeFileSync(dotFileLocation, JSON.stringify(options, null, 2));
} else {
  const dotFileConfig = fs.readFileSync(dotFileLocation, {
    encoding: "utf8",
    flag: "r",
  });
  if (dotFileConfig.trim() === "")
    fs.writeFileSync(dotFileLocation, JSON.stringify(options, null, 2));
  else {
    if (isJsonString(dotFileConfig)) {
      const parsedConfig = JSON.parse(dotFileConfig);
      options.ignores =
        parsedConfig.ignores.map((_) => path.normalize(_)) || [];
      options.queryIgnores =
        parsedConfig.queryIgnores.map((_) => path.normalize(_)) || [];
      options.openFile = parsedConfig.openFile || getFileDefaults();
    } else {
      console.log(
        ".zeus file is corrupted. Please resolve the issue for Zeus to pick the config from it"
      );
    }
  }
}

export default {
  ...options,
  getFileCommand(dir) {
    if (typeof options.openFile === "string") {
      return options.openFile.replace("${PATH}", dir);
    } else if (typeof options.openFile === "object") {
      for (let key of Object.keys(options.openFile)) {
        if (typeof options.openFile[key] === "string" && dir.endsWith(key)) {
          return options.openFile[key].replace("${PATH}", dir);
        }
      }
      const defaults = options.openFile["defaults"];
      return defaults && typeof defaults === "string"
        ? defaults.replace("${PATH}", dir)
        : getFileDefaults().replace("${PATH}", dir);
    }
  },
} as config;
