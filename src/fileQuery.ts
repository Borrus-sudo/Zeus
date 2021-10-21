import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { existsInDepth, isProject, matchingProjectLinks } from "./utils";
import * as fs from "fs";
const queryIgnores = ["$RECYCLE.BIN", "node_modules", ".git"];
export default {
  filter(
    config: configDescriptor[],
    files: contentDescriptor[]
  ): contentDescriptor[] {
    if (config.length > 0) {
      if (
        config[FlagTypes.FilterExtension] &&
        config[FlagTypes.FilterExtension].flag === "filterExtensions"
      ) {
        const currFolderPath = files[0].fullPath;
        if (
          !matchingProjectLinks.includes(currFolderPath) &&
          !matchingProjectLinks.some((link) => currFolderPath.startsWith(link))
        ) {
          const [addFile, getProjectsLabels] = isProject();
          const pathContents = fs.readdirSync(currFolderPath);
          for (let content of pathContents) {
            addFile(content);
          }
          const askedForLabels =
            config[FlagTypes.FilterExtension].value.split(",");
          const gotLabels = getProjectsLabels();
          if (
            askedForLabels.every(
              (item: string) => gotLabels.indexOf(item) !== -1
            )
          ) {
            matchingProjectLinks.push(currFolderPath);
          } else {
            files = files.filter((file) => {
              if (
                file.isDir &&
                file.name !== "../" &&
                !queryIgnores.includes(file.name.slice(0, -1))
              ) {
                return matchingProjectLinks.some((elem) => {
                  elem.startsWith(file.toPath);
                })
                  ? true
                  : existsInDepth(file.toPath, askedForLabels);
              }
              return file.name === "../";
            });
          }
        }
      } else {
        if (
          config[FlagTypes.Before] &&
          config[FlagTypes.Before].flag === "before"
        ) {
          files = files.filter((file) => {
            if (file.isDir) {
              return true;
            }
            if (file.created) {
              const date: Date = new Date(
                config[FlagTypes.Before].value.trim()
              );
              if (date > file.created) {
                return true;
              } else {
                return false;
              }
            }
            return false;
          });
        }
        if (
          config[FlagTypes.After] &&
          config[FlagTypes.After].flag === "after"
        ) {
          files = files.filter((file) => {
            if (file.isDir) {
              return true;
            }
            if (file.created) {
              const date: Date = new Date(config[FlagTypes.Before].value);
              if (date < file.created) {
                return true;
              }
            }
            return false;
          });
        }
      }
    }
    return files;
  },
};
