import FlagList from "./flagParser";
import { contentDescriptor, FlagTypes } from "./types";
import { appendGlyph } from "./utils";
import formatting from './formatting';

export default function (data: contentDescriptor[], term) {
  if (data[0].name === "../") {
    data.splice(0, 1);
  }
  for (const content of data) {
    const metaContent = `${formatting.blue}${content.meta
      .slice(0, 10)
      .padEnd(10, " ")}`;

    const lastModified = `${formatting.red}${content.lastModified
      .slice(0, 19)
      .padEnd(19, " ")}`;

    const size = `${formatting.green}${content.size
      .slice(0, 9)
      .padEnd(9, " ")}`;

    const indicator = `${formatting.yellow}${(content.isDir
      ? "<DIR>"
      : "<FILE>"
    ).padEnd(8, " ")}`;

    const dirent = `${(FlagList[FlagTypes.Icons] && content.name !== "../"
      ? appendGlyph(content.toPath, content.name, content.isDir)
      : content.name
    )
      .slice(0, 30)
      .padEnd(30, " ")}`;

    const out = `${formatting.bold
      }${metaContent}${formatting.padding}${size}${formatting.padding}${lastModified}${formatting.padding}${indicator}${formatting.padding}${content.isDir ? "^c" : "^w"
      }${dirent}`;

    term(out + "\n");
  }

}
