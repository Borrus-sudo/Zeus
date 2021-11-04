import FlagList from "./flagParser";
import { contentDescriptor, FlagTypes } from "./types";
import { appendGlyph } from "./utils";
import Icons = require("nf-icons");
export default function (data: contentDescriptor[], term) {
  const bold = "^+";
  const blue = "^b";
  const red = "^r";
  const green = "^g";
  const yellow = "^y";
  const padding = " ".repeat(1);
  for (let content of data) {
    const metaContent = `${blue}${content.meta.slice(0, 10).padEnd(10, " ")}`;
    const lastModified = `${red}${content.lastModified
      .slice(0, 19)
      .padEnd(19, " ")}`;
    const size = `${green}${content.size.slice(0, 9).padEnd(9, " ")}`;
    const indicator = `${yellow}${content.isDir ? "<DIR>" : "<FILE>"}`;
    const dirent = `${(FlagList[FlagTypes.Icons]
      ? appendGlyph(content.name, content.isDir)
      : content.name
    )
      .slice(0, 30)
      .padEnd(30, " ")}`;
    const out = `${bold}${padding}${metaContent}${padding}${size}${padding}${lastModified}${padding}${indicator}${padding}${dirent}`;
    term(out + "\n");
  }
}
