import * as path from "path";
import { terminal as term } from "terminal-kit";
import MagicExplorer from "./VirtualExplorer";
require("terminal-kit-plugins").plugin(term);
const clear = require("clear");
const explorer = new MagicExplorer(
  path.dirname(process.cwd()),
  path.basename(process.cwd()),
  []
);
const tableConfig = {
  x: 0,
  y: 0,
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
};
const submitCallback = (item) => {
  const res = explorer.commitAction({
    name: item.cells.name.trim(),
    verb: "display",
  });
  if (res.redraw) {
    term
      .DataTable(tableConfig)
      .setData(explorer.getChildren()) //modified the node dependency to allow this chaining
      .promise.then(submitCallback);
  }
};

clear(true); // Clear the full terminal screen
const table = term.DataTable(tableConfig);
table.setData(explorer.getChildren());
table.promise.then(submitCallback);
