import * as fs from "fs";
import * as path from "path";
import Config from "./resolveConfig";
import { configDescriptor, contentDescriptor, FlagTypes } from "./types";
import { cache, existsInDepth, isProject, queryIgnores } from "./utils";
import RegexParser = require("regex-parser");
queryIgnores.push(...Config.queryIgnores);
export default {
  filter(
    config: configDescriptor[],
    files: contentDescriptor[]
  ): contentDescriptor[] {
    if (config.length > 0) {
      const descriptor: {
        before: undefined | Date;
        after: undefined | Date;
        regex: RegExp | undefined;
      } = { before: undefined, after: undefined, regex: undefined };
      descriptor.before = config[FlagTypes.Before]
        ? new Date(config[FlagTypes.Before].value)
        : undefined;
      descriptor.after = config[FlagTypes.After]
        ? new Date(config[FlagTypes.After].value)
        : undefined;
      descriptor.regex = config[FlagTypes.Regex]
        ? RegexParser(config[FlagTypes.Regex].value)
        : undefined;
      if (config[FlagTypes.FilterExtension]) {
        const currFolderPath = files[0].fullPath;
        const isFoundProject = cache.indexOf(currFolderPath) != -1;
        const isChildOfProject = cache.some((link) =>
          currFolderPath.startsWith(link)
        );
        if (!isFoundProject && !isChildOfProject) {
          const askedForLabels =
            config[FlagTypes.FilterExtension].value.split(",");
          const [addFile, getProjectsLabels] = isProject(
            askedForLabels.indexOf("git") != -1
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
          const matchesRegex = descriptor.regex
            ? descriptor.regex.test(path.basename(currFolderPath))
            : true;
          if (
            res &&
            inTimeLimit &&
            matchesRegex &&
            cache.indexOf(currFolderPath) == -1
          ) {
            cache.push(currFolderPath);
          } else {
            return files.filter((file) => {
              if (
                file.isDir &&
                file.name !== "../" &&
                queryIgnores.indexOf(file.name.slice(0, -1)) == -1
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
        files = files.filter(
          (file) =>
            file.isDir ||
            (file.created &&
              (descriptor.before
                ? descriptor.before > file.created
                : true && descriptor.after
                ? descriptor.after < file.created
                : true))
        );
        files = descriptor.regex
          ? files.filter((elem) =>
              elem.isDir
                ? true
                : descriptor.regex.test(
                    path.basename(elem.toPath) + path.extname(elem.toPath)
                  )
            )
          : files;
      }
    }
    return files;
  },
};
