import { access, constants, promises as fs, Stats } from "fs";
import { join } from "path";
import FlagList from "./flagParser";
import Config from "./resolveConfig";
import { contentDescriptor, FlagTypes } from "./types";
import path = require("path");
import Icons = require("nf-icons");
import prettyBytes = require("pretty-bytes");
import micromatch = require("micromatch");

export function getMetaDetails(stats: Stats) {
  let stat = "";
  stat += stats["mode"] & 1 ? "x" : "-";
  stat += stats["mode"] & 2 ? "w" : "-";
  stat += stats["mode"] & 4 ? "r" : "-";
  stat += stats["mode"] & 10 ? "x" : "-";
  stat += stats["mode"] & 20 ? "w" : "-";
  stat += stats["mode"] & 40 ? "r" : "-";
  stat += stats["mode"] & 100 ? "x" : "-";
  stat += stats["mode"] & 200 ? "w" : "-";
  stat += stats["mode"] & 400 ? "r" : "-";
  return stat;
}

export function formatDate(date: Date) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  } as const;
  return date.toLocaleDateString("en-US", options);
}

export async function rmDir(path: string) {
  if (await existsAsync(path)) {
    const files = (await fs.readdir(path)) || [];
    for (let fileName of files) {
      if ((await fs.stat(join(path, fileName))).isDirectory()) {
        await rmDir(join(path, fileName));
      } else {
        await fs.unlink(join(path, fileName));
      }
    }
  }
  await fs.rmdir(path);
}

export function getGlobalIgnores(): string[] {
  switch (process.platform) {
    case "win32":
      return ["System Volume Information"];
    default:
      return [".Trash"];
  }
}

function getQueryIgnores(): string[] {
  const queryIgnores = ["node_modules", ".git"];
  switch (process.platform) {
    case "win32":
      return ["$RECYCLE.BIN", "System Volume Information", ...queryIgnores];
    default:
      return [".Trash", ...queryIgnores];
  }
}

export function isProject(): [(content: string) => void, () => string[]] {
  const configLabels = JSON.parse(JSON.stringify(Config.labels));
  return [
    (content: string) => {
      for (let label of configLabels) {
        label.matchers = label.matchers.filter((match) => {
          return !micromatch.isMatch(content, match);
        });
      }
    },
    () => {
      const isTheFollowingProjects = [];
      for (let label of configLabels) {
        if (label.matchers.length === 0) {
          isTheFollowingProjects.push(label.name);
        }
      }
      return isTheFollowingProjects;
    },
  ];
}

export function appendGlyph(
  fileName: string,
  suffix: string,
  isDir: boolean
): string {
  const ext = path.extname(fileName).slice(1);
  let glyph = Config.getIcons(isDir ? fileName + "/" : fileName, suffix);

  if (glyph) {
    return glyph;
  }
  if (isDir) {
    return Icons.utf16(Icons.names.MDI_FOLDER) + " " + suffix;
  }
  glyph = "";
  switch (ext.toLowerCase()) {
    case "js":
      glyph = Icons.names.MDI_LANGUAGE_JAVASCRIPT;
      break;
    case "rs":
      glyph = Icons.names.DEV_RUST;
      break;
    case "json":
      glyph = Icons.names.MDI_JSON;
      break;
    case "ts":
      glyph = Icons.names.MDI_LANGUAGE_TYPESCRIPT;
      break;
    case "java":
      glyph = Icons.names.DEV_JAVA;
      break;
    case "cpp":
      glyph = Icons.names.CUSTOM_CPP;
      break;
    case "css":
      glyph = Icons.names.DEV_CSS3;
      break;
    case "htm":
    case "html":
      glyph = Icons.names.DEV_HTML5;
      break;
    case "go":
      glyph = Icons.names.DEV_GO;
      break;
    case "py":
      glyph = Icons.names.DEV_PYTHON;
      break;
    case "rb":
      glyph = Icons.names.DEV_RUBY;
      break;
    case "pl":
      glyph = Icons.names.DEV_PERL;
      break;
    case "c":
      glyph = Icons.names.CUSTOM_C;
      break;
    case "ex":
    case "exs":
      glyph = Icons.names.CUSTOM_ELIXIR;
      break;
    case "erl":
      glyph = Icons.names.DEV_ERLANG;
      break;
    case "php":
      glyph = Icons.names.DEV_PHP;
      break;
    case "hs":
    case "hls":
      glyph = Icons.names.DEV_HASKELL;
      break;
    case "clj":
    case "cljs":
    case "cljc":
    case "edn":
      glyph = Icons.names.DEV_CLOJURE;
      break;
    case "swift":
      glyph = Icons.names.DEV_SWIFT;
      break;
    case "dart":
      glyph = Icons.names.DEV_DART;
      break;
    case "vue":
      glyph = Icons.names.MDI_VUEJS;
      break;
    case "svg":
      glyph = Icons.names.MDI_SVG;
      break;
    case "jsx":
    case "tsx":
      glyph = Icons.names.DEV_REACT;
      break;
    case "txt":
      glyph = Icons.names.FA_FILE_TEXT;
      break;
    case "md":
      glyph = Icons.names.MDI_MARKDOWN;
      break;
    case "png":
    case "jpg":
    case "jpeg":
      glyph = Icons.names.FA_PHOTO;
      break;
    case "pdf":
      glyph = Icons.names.MDI_FILE_PDF;
      break;
    case "mp4":
    case "avi":
    case "mkv":
    case "mov":
    case "wmv":
    case "flv":
      glyph = Icons.names.MDI_VIDEO;
      break;
    case "wav":
    case "mp3":
      glyph = Icons.names.MDI_SOUNDCLOUD;
      break;
    case "exe":
      glyph = Icons.names.OCT_FILE_BINARY;
      break;
    case "zip":
      glyph = Icons.names.MDI_ZIP_BOX;
      break;
    case "ttf":
      glyph = Icons.names.FA_FONT;
      break;
    default:
      break;
  }
  return (glyph ? Icons.utf16(glyph) + " " : "") + suffix;
}

export const queryIgnores = [
  ...Config.queryIgnores,
  ...getQueryIgnores(),
  ...(FlagList[FlagTypes.QIgnore]
    ? FlagList[FlagTypes.QIgnore].value.split(",")
    : []),
];
export const cache: string[] = [];

export async function existsInDepth(
  folderPath: string,
  askedForLabels: string[],
  descriptor: {
    before: undefined | Date;
    after: undefined | Date;
    regex: RegExp | undefined;
  }
): Promise<boolean> {
  const contents = await fs.readdir(folderPath, { withFileTypes: true });
  const [addFile, getProjectsLabels] = isProject();

  const dirs = [];
  for (let content of contents) {
    const contentPath = path.join(folderPath, content.name);
    addFile(content.name);
    if (
      content.isDirectory() &&
      !queryIgnores.includes(path.basename(contentPath)) &&
      !queryIgnores.includes(contentPath)
    ) {
      dirs.push(contentPath);
    }
  }

  const gotLabels = getProjectsLabels();
  const res = askedForLabels.some(
    (item: string) => gotLabels.indexOf(item) !== -1
  );
  const stat = await fs.stat(folderPath);
  const created = stat.birthtime;
  const inTimeLimit = descriptor.before
    ? descriptor.before > created
    : true && descriptor.after
    ? descriptor.after < created
    : true;
  const matchesRegex = descriptor.regex
    ? descriptor.regex.test(path.basename(folderPath))
    : true;

  if (res && inTimeLimit && matchesRegex) {
    if (cache.indexOf(folderPath) == -1) cache.push(folderPath);
    return true;
  } else {
    const responses = await Promise.all(
      dirs.map((dir) => existsInDepth(dir, askedForLabels, descriptor))
    );
    return responses.some((elem) => elem === true);
  }
}

export async function constructDescriptor(
  dirent: string
): Promise<contentDescriptor> {
  const stats = await fs.lstat(dirent);
  const elem = path.basename(dirent);

  if (!stats.isSymbolicLink()) {
    let isDir = stats.isDirectory();
    return {
      name: isDir ? elem + "/" : elem,
      isDir,
      size: isDir ? "" : prettyBytes(stats.size),
      lastModified: formatDate(stats.mtime),
      meta: getMetaDetails(stats),
      toPath: dirent,
      created: stats.birthtime,
    };
  } else {
    const target = path.resolve(
      path.dirname(dirent),
      path.normalize(await fs.readlink(dirent))
    );
    return {
      name: `${path.basename(dirent)} -> ${path.basename(target)}`,
      isDir: stats.isDirectory(),
      size: prettyBytes(stats.size),
      lastModified: formatDate(stats.mtime),
      meta: getMetaDetails(stats),
      toPath: target,
      created: stats.birthtime,
    };
  }
}

export async function existsAsync(pathName: string) {
  return new Promise(function (resolve, _reject) {
    access(pathName, constants.R_OK, (err: any) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
