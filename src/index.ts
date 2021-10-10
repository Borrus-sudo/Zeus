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
      style(_item) {
        return term.bold().brightYellow;
      },
    },
    {
      get(content) {
        return content.size;
      },
      width: 10,
      style() {
        return term.bold().brightGreen;
      },
    },
    {
      get(content) {
        return content.lastModified;
      },
      width: 20,
      style() {
        return term.bold().red;
      },
    },
  ],
};
function termCallback(key, tableInstance) {
  if (key === "ESCAPE") {
    process.exit();
  } else if (key === "CTRL_O" && tableInstance._state.selected) {
    const selectedState = tableInstance._state.selected;
    explorer.commitAction({
      name: selectedState.cells.name.trim(),
      verb: "open",
    });
  }
}
const submitCallback = (item) => {
  const res = explorer.commitAction({
    name: item.cells.name.trim(),
    verb: "display",
  });
  if (res.redraw) {
    const table = term.DataTable(tableConfig);
    table.setData(res.contents);
    table.promise.then(submitCallback);
    table._term.on("key", (key) => {
      termCallback(key, table);
    });
  }
};

clear(true); // Clear the full terminal screen
const table = term.DataTable(tableConfig);
table.setData(explorer.getChildren());
table.promise.then(submitCallback);
table._term.on("key", (key) => {
  termCallback(key, table);
});
