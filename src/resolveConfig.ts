import * as fs from "fs";
import * as path from "path";
import { config } from "./types";
const dotFileLocation = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  ".zeus"
);
let options: config = {
  ignores: ["node_modules", ".git"],
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
    const parsedConfig = JSON.parse(dotFileConfig);
    options.ignores = parsedConfig.ignores || [];
  }
}
export default options;
