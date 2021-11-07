import FlagList from "./flagParser";
import { contentDescriptor, FlagTypes } from "./types";
import { appendGlyph } from "./utils";
export default function (data: contentDescriptor[], term) {
  const bold = "^+";
  const blue = "^b";
  const red = "^r";
  const green = "^g";
  const yellow = "^y";
  const padding = " ".repeat(1);
  if (data[0].name === "../") {
    data.splice(0, 1);
  }
  for (let content of data) {
    const metaContent = `${blue}${content.meta.slice(0, 10).padEnd(10, " ")}`;
    const lastModified = `${red}${content.lastModified
      .slice(0, 19)
      .padEnd(19, " ")}`;
    const size = `${green}${content.size.slice(0, 9).padEnd(9, " ")}`;
    const indicator = `${yellow}${(content.isDir ? "<DIR>" : "<FILE>").padEnd(
      8,
      " "
    )}`;
    const dirent = `${(FlagList[FlagTypes.Icons]
      ? appendGlyph(content.name, content.isDir)
      : content.name
    )
      .slice(0, 30)
      .padEnd(30, " ")}`;
    const out = `${bold}${metaContent}${padding}${size}${padding}${lastModified}${padding}${indicator}${padding}${
      content.isDir ? "^c" : "^w"
    }${dirent}`;
    term(out + "\n");
  }
}
