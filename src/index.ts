import * as path from "path";
import { terminal as term } from "terminal-kit";
import MagicExplorer from "./VirtualExplorer";
const DataTable = require("../utils/data-table.js").DataTableFactory;
let table;
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

//Important callbacks
const keyCallBack = (key, table) => {
  if (key === "CTRL_O" && table._state.selected) {
    const selectedState = table._state.selected;
    explorer.commitAction({
      name: selectedState.cells.name.trim(),
      verb: "open",
    });
  }
};
const submitCallback = (item) => {
  const res = explorer.commitAction({
    name: item.cells.name.trim(),
    verb: "display",
  });
  if (res.redraw) {
    table = DataTable(term, tableConfig);
    table.setData(res.contents);
    table.promise.then(submitCallback);
    table._term.on("key", (key) => keyCallBack(key, table));
  }
};

// Logic body
term.clear(true);
table = DataTable(term, { ...tableConfig, data: explorer.getChildren() });
table.promise.then(submitCallback);
table._term.on("key", (key) => keyCallBack(key, table));
