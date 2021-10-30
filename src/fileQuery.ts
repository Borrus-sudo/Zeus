import * as fs from "fs";
import * as path from "path";
import { contentDescriptor, flagDescriptor, FlagTypes } from "./types";
import {
  cache,
  existsInDepth,
  isProject,
  queryIgnores,
  asyncFilter,
} from "./utils";
import RegexParser = require("regex-parser");
export default {
  async filter(
    flags: flagDescriptor[],
    files: contentDescriptor[]
  ): Promise<contentDescriptor[]> {
    if (flags.length > 0) {
      const descriptor: {
        before: undefined | Date;
        after: undefined | Date;
        regex: RegExp | undefined;
      } = { before: undefined, after: undefined, regex: undefined };
      descriptor.before = flags[FlagTypes.Before]
        ? new Date(flags[FlagTypes.Before].value)
        : undefined;
      descriptor.after = flags[FlagTypes.After]
        ? new Date(flags[FlagTypes.After].value)
        : undefined;
      descriptor.regex = flags[FlagTypes.Regex]
        ? RegexParser(flags[FlagTypes.Regex].value)
        : undefined;
      if (flags[FlagTypes.FilterExtension]) {
        const currFolderPath = files[0].fullPath;
        const isFoundProject = cache.indexOf(currFolderPath) != -1;
        const isChildOfProject = cache.some((link) =>
          currFolderPath.startsWith(link)
        );
        if (!isFoundProject && !isChildOfProject) {
          const askedForLabels =
            flags[FlagTypes.FilterExtension].value.split(",");
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
          if (res && inTimeLimit && matchesRegex) {
            if (cache.indexOf(currFolderPath) == -1) cache.push(currFolderPath);
          } else {
            let goneForCheckingIndices: number[] = [];
            const definiteFolders = [];
            const checkForFolders = files.filter((content, index) => {
              if (content.name === "../") {
                definiteFolders.push(content);
              } else if (
                content.isDir &&
                queryIgnores.indexOf(content.name.slice(0, -1)) == -1
              ) {
                if (cache.some((elem) => elem.startsWith(content.toPath)))
                  definiteFolders.push(content);
                else {
                  goneForCheckingIndices.push(index);
                  return true;
                }
              }
              return false;
            });
            const res = [...definiteFolders];
            (
              await Promise.all(
                checkForFolders.map((folder) =>
                  existsInDepth(folder.toPath, askedForLabels, descriptor)
                )
              )
            ).forEach((elem, index) => {
              if (elem) {
                res.push(files[goneForCheckingIndices[index]]);
              }
            });
            return res;
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
    return Promise.resolve(files);
  },
};
