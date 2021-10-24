import * as fs from "fs";
import * as path from "path";
import { config } from "./types";
import { getFileDefaults, isJsonString } from "./utils";
const dotFileLocation = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  ".zeus"
);
let options: config = {
  ignores: [],
  queryIgnores:[],
  openFile: getFileDefaults(),
};
if (!fs.existsSync(dotFileLocation)) {
  const defaults = JSON.stringify(options, null, 2);
  fs.writeFileSync(dotFileLocation, defaults);
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
      options.ignores = parsedConfig.ignores || [];
      options.queryIgnores = parsedConfig.queryIgnores || [];
      options.openFile = parsedConfig.openFile || getFileDefaults();
    } else {
      console.log(
        ".zeus file is corrupted. Please resolve the issue for Zeus to pick the config from it"
      );
    }
  }
}
export default options;
