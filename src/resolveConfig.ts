import * as fs from "fs";
import * as path from "path";
import { config } from "./types";
import { getFileDefaults, getTerminalDefaults, isJsonString } from "./utils";
const dotFileLocation = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  ".zeus"
);
let options: config = {
  ignores: ["node_modules", ".git"],
  openTerminal: getTerminalDefaults(),
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
  if (dotFileConfig.trim() === "") {
    const defaults = JSON.stringify(options, null, 2);
    fs.writeFileSync(dotFileLocation, defaults);
  } else {
    if (isJsonString(dotFileConfig)) {
      const parsedConfig = JSON.parse(dotFileConfig);
      options.ignores = parsedConfig.ignores || [];
      options.openFile = parsedConfig.openFile || getFileDefaults();
      options.openTerminal = parsedConfig.openTerminal || getTerminalDefaults();
    } else {
      console.log(
        ".zeus file is corrupted. Please resolve the issue for Zeus to pick the config from it"
      );
    }
  }
}
export default options;
