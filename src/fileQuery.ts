import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { findProjectDepth, isProject } from "./utils";
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
        const [addFile, getProjectsLabels] = isProject();
        const dirs = [];
        for (let file of files) {
          if (file.name !== "../" && !file.name.includes("->")) {
            addFile(file.name);
          }
          if (file.name !== "../" && file.isDir) {
            dirs.push(file.toPath);
          }
        }
        const projectLabels = getProjectsLabels();
        if (projectLabels.includes(config[FlagTypes.FilterExtension].value)) {
          // Nothing to filter
          //Check for before and after flag and accordingly keep or delete it
        } else {
          // filter out files and eagerly walk through dirs till the appropriate project label
          // is found or filter it as well
          for (let dir of dirs) {
            const res = findProjectDepth(
              dir,
              config[FlagTypes.FilterExtension].value
            );
            if (res) {
              // dep has the proj
            } else {
              // dep does not have proj
            }
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
