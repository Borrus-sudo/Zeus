import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { existsInDepth, isProject, matchingProjectLinks } from "./utils";
import * as fs from "fs";
import { normalize } from "path";
const queryIgnores = ["$RECYCLE.BIN"];
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
        if (!matchingProjectLinks.includes(currFolderPath)) {
          const [addFile, getProjectsLabels] = isProject();
          const pathContents = fs.readdirSync(currFolderPath);
          for (let content of pathContents) {
            addFile(content);
          }
          const projectLabels = getProjectsLabels();
          if (
            projectLabels.includes(
              config[FlagTypes.FilterExtension].value.trim()
            )
          ) {
            matchingProjectLinks.push(currFolderPath);
          } else {
            files = files.filter((file) => {
              if (
                file.isDir &&
                file.name !== "../" &&
                !queryIgnores.includes(file.name)
              ) {
                return matchingProjectLinks.some((elem) => {
                  elem.startsWith(normalize(file.toPath));
                })
                  ? true
                  : existsInDepth(
                      file.toPath,
                      config[FlagTypes.FilterExtension].value.trim()
                    );
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
