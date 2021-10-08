import * as path from "path";
import { terminal as term } from "terminal-kit";
import MagicExplorer from "./VirtualExplorer";
require("terminal-kit-plugins").plugin(term);

const explorer = new MagicExplorer(
  path.dirname(process.cwd()),
  path.basename(process.cwd()),
  []
);
const table = term.DataTable(
  {
    x: 0,
    y: 5,
    width: null,
    height: term.height,
    style: term.brightWhite.bgBlack,
    selectedStyle: term.bgBrightWhite.black,
    scrollPadding: 3,
    padding: 1,
    filterTextSize: 16,
    columns: [
      {
        get(content) {
          return content.name;
        },
        width: 20,
        style(item) {
          return item.isDir ? term.brightMagenta : term.cyan;
        },
      },
    ],
  },
  () => {
    console.log("Called");
  }
);

table.setData(explorer.getChildren());
table.promise.then((item) => {
  console.log(item);
  const res = explorer.commitAction({
    name: item.name.trim(),
    verb: "display",
  });
  if (res.redraw) {
    table.setData(explorer.getChildren());
  }
});
