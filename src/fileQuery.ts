import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { findProjectDepth, isProject, matchingProjectLinks } from "./utils";
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
        if (!matchingProjectLinks.includes(files[0].fullPath)) {
          const [addFile, getProjectsLabels] = isProject();
          for (let file of files) {
            if (file.name !== "../" && !file.name.includes("->")) {
              addFile(file.name);
            }
          }
          const projectLabels = getProjectsLabels();
          if (projectLabels.includes(config[FlagTypes.FilterExtension].value)) {
            matchingProjectLinks.push(files[0].fullPath);
          } else {
            // filter out files and eagerly walk through dirs till the appropriate project label
            // is found or filter it as well
            files = files.filter((file) => {
              if (file.isDir && file.name !== "../") {
                //instead of going through all depth, check if the dir is a parent of any of
                // the projectLinks
                return matchingProjectLinks.some((elem) => {
                  elem.startsWith(file.toPath);
                })
                  ? true
                  : findProjectDepth(
                      file.toPath,
                      config[FlagTypes.FilterExtension].value
                    );
              }
              return file.name !== "../";
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
