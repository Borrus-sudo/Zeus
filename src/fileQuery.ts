import * as fs from "fs";
import { promises as fsP } from "fs";
import * as path from "path";
import { contentDescriptor, flagDescriptor, FlagTypes } from "./types";
import {
  cache,
  constructDescriptor,
  existsInDepth,
  isProject,
  queryIgnores
} from "./utils";
import RegexParser = require("regex-parser");
import micromatch = require("micromatch");

const fileQuery = {
  async filter(
    FlagList: flagDescriptor[],
    files: contentDescriptor[]
  ): Promise<contentDescriptor[]> {

    if (FlagList.length > 0) {
      
      const descriptor: {
        before: undefined | Date;
        after: undefined | Date;
        regex: RegExp | undefined;
      } = { before: undefined, after: undefined, regex: undefined };

      descriptor.before = FlagList[FlagTypes.Before]
        ? new Date(FlagList[FlagTypes.Before].value)
        : undefined;
      
      descriptor.after = FlagList[FlagTypes.After]
        ? new Date(FlagList[FlagTypes.After].value)
        : undefined;
      
      descriptor.regex = FlagList[FlagTypes.Regex]
        ? RegexParser(FlagList[FlagTypes.Regex].value)
        : undefined;
      
      const currFolderPath = files[0].fullPath;

      if (FlagList[FlagTypes.FilterExtension]) {
        const isFoundProject = cache.indexOf(currFolderPath) != -1;
        const isChildOfProject = cache.some((link) =>
          currFolderPath.startsWith(link)
        );

        if (!isFoundProject && !isChildOfProject) {
          const askedForLabels =
            FlagList[FlagTypes.FilterExtension].value.split(",");
          
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
            if (FlagList[FlagTypes.Find]) {
              const matcher = FlagList[FlagTypes.Find].value;
              const content = await fileQuery.find(currFolderPath, matcher);
              if (content.length > 0) {
                return await Promise.all(
                  content.map((elem) => constructDescriptor(elem))
                );
              } else {
                console.log("No results found");
                process.exit();
              }
            }
          } else {
            let res = [];

            if (FlagList[FlagTypes.Find]) {
              const checkForFolders = files.filter((content, index) => {
                if (content.name === "../") {
                } else if (
                  content.isDir &&
                  queryIgnores.indexOf(content.name.slice(0, -1)) == -1 &&
                  queryIgnores.indexOf(content.toPath) == -1
                ) {
                  if (cache.some((elem) => elem.startsWith(content.toPath))) {
                  } else {
                    return true;
                  }
                }
                return false;
              });

              await Promise.all(
                checkForFolders.map((folder) =>
                  existsInDepth(folder.toPath, askedForLabels, descriptor)
                )
              );
              const content = await fileQuery.find(
                cache,
                FlagList[FlagTypes.Find].value
              );

              if (content.length < 1) {
                console.log("No results found");
                process.exit();
              }
              res = await Promise.all(
                content.map((elem) => constructDescriptor(elem))
              );
            } else {
              let goneForCheckingIndices: number[] = [];
              const definiteFolders = [];

              const checkForFolders = files.filter((content, index) => {
                if (content.name === "../") {
                  definiteFolders.push(content);
                } else if (
                  content.isDir &&
                  queryIgnores.indexOf(content.name.slice(0, -1)) == -1 &&
                  queryIgnores.indexOf(content.toPath) == -1
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
              
              res.push(...definiteFolders);
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
            }
            return res;
          }
        } else {
          
          if (FlagList[FlagTypes.Find]) {
            const matcher = FlagList[FlagTypes.Find].value;
            const content = await fileQuery.find(currFolderPath, matcher);
            if (content.length > 0) {
              return await Promise.all(
                content.map((elem) => constructDescriptor(elem))
              );
            } else {
              console.log("No results found");
              process.exit();
            }
          } else return files;
        }
      } else {
        
        if (FlagList[FlagTypes.Find]) {
          const matcher = FlagList[FlagTypes.Find].value;
          const content = await fileQuery.find(currFolderPath, matcher);

          if (content.length > 0) {
            files = await Promise.all(
              content.map((elem) => constructDescriptor(elem))
            );
          } else {
            console.log("No results found");
            process.exit();
          }
        }

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
        
        return files;
      }
    } else {
      return files;
    }
  },

  async find(dirs: string[] | string, matcher: string): Promise<string[]> {
    if (Array.isArray(dirs)) {
      
      return [
        ...(
          await Promise.all(dirs.map((dir) => fileQuery.find(dir, matcher)))
        ).flat(),
      ];

    } else {
      // search within the received directory
      if (
        !queryIgnores.includes(dirs) &&
        !queryIgnores.includes(path.basename(dirs))
      ) {
        const dirents = await fsP.readdir(dirs, { withFileTypes: true });
        const findThrough = [];
        const matched = [];

        for (let dirent of dirents) {
          if (dirent.isDirectory()) {
            if (micromatch.isMatch(dirent.name, matcher)) {
              matched.push(path.join(dirs, dirent.name));
            }
            findThrough.push(dirent.name);
          } else
            micromatch.isMatch(dirent.name, matcher)
              ? matched.push(path.join(dirs, dirent.name))
              : 0;
        }

        return [
          ...matched,
          ...(
            await Promise.all(
              findThrough.map((_) =>
                fileQuery.find(path.join(dirs, _), matcher)
              )
            )
          ).flat(),
        ].filter(Boolean);
      } else [];
    }
  },
};

export default fileQuery;
