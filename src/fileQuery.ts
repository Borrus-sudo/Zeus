import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
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
      }
      if (
        config[FlagTypes.Before] &&
        config[FlagTypes.Before].flag === "before"
      ) {
        return files.filter((file) => {
          if (file.isDir) {
            return true;
          }
          if (file.created) {
            const date: Date = new Date(config[FlagTypes.Before].value.trim());
            if (date > file.created) {
              return true;
            } else {
              return false;
            }
          }
          return false;
        });
      }
      if (config[FlagTypes.After] && config[FlagTypes.After].flag === "after") {
        return files.filter((file) => {
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
    return files;
  },
};
