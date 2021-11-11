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

function validateLabels(labels): { name: string; matchers: string[] }[] {
  if (Array.isArray(labels)) {
    const validateLabels = [];
    for (let label of labels) {
      if (typeof label === "object") {
        const condition1 =
          label.hasOwnProperty("name") && typeof label.name === "string";
        const condition2 =
          label.hasOwnProperty("matchers") && Array.isArray(label.matchers);
        if (condition1 && condition2) {
          label.matchers = label.matchers.map(String);
          validateLabels.push(label);
        }
      }
    }
    return validateLabels;
  }
  return [];
}

let options: Omit<config, "getFileCommand" | "getIcons"> = {
  ignores: [],
  queryIgnores: [],
  openFile: getFileDefaults(),
  icons: {},
  labels: [],
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
      options.icons = parsedConfig.icons || {};
      options.labels = parsedConfig.labels
        ? validateLabels(parsedConfig.labels)
        : [];
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

  getIcons(name: string, suffix: string): string {
    if (typeof options.icons === "object") {
      for (let key of Object.keys(options.icons)) {
        if (typeof options.icons[key] === "string") {
          if (name.endsWith(key)) {
            return options.icons[key] + " " + suffix;
          }
        }
      }
    }
    return "";
  },
} as config;
