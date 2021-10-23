import * as fs from "fs";
import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { cache, existsInDepth, isProject, queryIgnores } from "./utils";
export default {
  filter(
    config: configDescriptor[],
    files: contentDescriptor[]
  ): contentDescriptor[] {
    if (config.length > 0) {
      const descriptor: { before: undefined | Date; after: undefined | Date } =
        { before: undefined, after: undefined };
      descriptor.before = config[FlagTypes.Before]
        ? new Date(config[FlagTypes.Before].value)
        : undefined;
      descriptor.after = config[FlagTypes.After]
        ? new Date(config[FlagTypes.After].value)
        : undefined;
      if (config[FlagTypes.FilterExtension]) {
        const currFolderPath = files[0].fullPath;
        const isFoundProject = cache.includes(currFolderPath);
        const isChildOfProject = cache.some((link) =>
          currFolderPath.startsWith(link)
        );
        if (!isFoundProject && !isChildOfProject) {
          const askedForLabels =
            config[FlagTypes.FilterExtension].value.split(",");
          const [addFile, getProjectsLabels] = isProject(
            askedForLabels.includes("git")
          );
          const pathContents = fs.readdirSync(currFolderPath);
          for (let content of pathContents) {
            addFile(content);
          }
          const gotLabels = getProjectsLabels();
          const res = askedForLabels.some(
            (item: string) => gotLabels.indexOf(item) !== -1
          );
          const created = fs.statSync(currFolderPath).birthtime;
          const inTimeLimit = descriptor.before
            ? descriptor.before > created
            : true && descriptor.after
            ? descriptor.after < created
            : true;
          if (res && inTimeLimit && !cache.includes(currFolderPath)) {
            cache.push(currFolderPath);
          } else {
            return files.filter((file) => {
              if (
                file.isDir &&
                file.name !== "../" &&
                !queryIgnores.includes(file.name.slice(0, -1))
              ) {
                return cache.some((elem) => {
                  elem.startsWith(file.toPath);
                })
                  ? true
                  : existsInDepth(file.toPath, askedForLabels, descriptor);
              }
              return file.name === "../";
            });
          }
        }
      } else {
        return files.filter(
          (file) =>
            file.isDir ||
            (file.created &&
              (descriptor.before
                ? descriptor.before > file.created
                : true && descriptor.after
                ? descriptor.after < file.created
                : true))
        );
      }
    }
    return files;
  },
};
