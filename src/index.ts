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
        return content.meta;
      },
      width: 10,
      style() {
        return term.bold().blue;
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
    {
      get(content) {
        return content.size;
      },
      width: 10,
      style() {
        return term.bold().colorRgb(34, 196, 130);
      },
    },
    {
      get(content) {
        return content.isDir ? "<DIR>" : "<FILE>";
      },
      width: 9,
      style() {
        return term.italic();
      },
    },
    {
      get(content) {
        return content.name;
      },
      width: 20,
      style(item) {
        return item.isDir ? term.bold().colorRgb(40, 182, 217) : term.bold();
      },
    },
  ],
};

//Important callbacks
const returnCallBack = (table) => {
  let state = "";
  let prevObj: { name: string; isDir: Boolean } = {
    name: "",
    isDir: undefined,
  };
  return (key) => {
    if (table._state.selected) {
      const selectedState = table._state.selected;
      switch (key) {
        case "CTRL_O":
          explorer.commitAction({
            name: path.join(
              explorer.getFullPath(),
              selectedState.cells.name.trim()
            ),
            verb: "open",
            isDir: selectedState.cells.isDir,
          });
          break;
        case "CTRL_X":
          state = `cut`;
          prevObj = {
            name: path.join(
              explorer.getFullPath(),
              selectedState.cells.name.trim()
            ),
            isDir: selectedState.cells.isDir,
          };
          break;
        case "CTRL_D":
          const res = explorer.commitAction({
            name: path.join(
              explorer.getFullPath(),
              selectedState.cells.name.trim()
            ),
            verb: "delete",
            isDir: selectedState.cells.isDir,
          });
          if (res.redraw) {
            table.setData(res.contents);
            table.promise.then(submitCallback);
          }
          break;
        case "CTRL_C":
          state = `copy`;
          prevObj = {
            name: path.join(
              explorer.getFullPath(),
              selectedState.cells.name.trim()
            ),
            isDir: selectedState.cells.isDir,
          };
          break;
        case "CTRL_P":
          const [verb, from, isDir] =
            state === "cut"
              ? ["cut", prevObj.name, prevObj.isDir]
              : ["copy", prevObj.name, prevObj.isDir];
          state = "";
          prevObj = {
            name: "",
            isDir: undefined,
          };
          if (from) {
            const res = explorer.commitAction({
              from,
              to: explorer.getFullPath(),
              verb,
              isDir,
            });
            if (res.redraw) {
              table.setData(res.contents);
              table.promise.then(submitCallback);
            }
          }
          break;
      }
    }
  };
};
const submitCallback = (item) => {
  const res = explorer.commitAction({
    name: path.join(explorer.getFullPath(), item.cells.name.trim()),
    verb: "submit",
    isDir: item.cells.isDir,
  });
  if (res.redraw) {
    table.setData(res.contents);
    table.promise.then(submitCallback);
  }
};

// Logic body
term.clear(true);
table = DataTable(term, { ...tableConfig, data: explorer.getChildren() });
table.promise.then(submitCallback);
table._term.on("key", returnCallBack(table));
