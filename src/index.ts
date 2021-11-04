import * as path from "path";
import { terminal as term } from "terminal-kit";
import FlagList from "./flagParser";
import Config from "./resolveConfig";
import { FlagTypes } from "./types";
import { appendGlyph } from "./utils";
import MagicExplorer from "./VirtualExplorer";
import Icons = require("nf-icons");
import CustomRenderer from "./CustomRenderer";
const DataTable = require("../utils/data-table.js").DataTableFactory;
(async () => {
  let table;
  const explorer = new MagicExplorer(
    path.dirname(process.cwd()),
    path.basename(process.cwd()),
    Config
  );
  if (FlagList[FlagTypes.LS]) {
    CustomRenderer(await explorer.getChildren(), term);
  } else {
    const tableConfig = {
      x: 0,
      y: -1,
      width: null,
      height: term.height + 2,
      style: term.brightWhite.bgBlack,
      selectedStyle: term.bgBrightWhite.black,
      scrollPadding: 2,
      padding: 0.1,
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
          width: 19,
          style() {
            return term.bold().red;
          },
        },
        {
          get(content) {
            return content.size;
          },
          width: 9,
          style() {
            return term.bold().green;
          },
        },
        {
          get(content) {
            return content.isDir ? "<DIR>" : "<FILE>";
          },
          width: 8,
          style() {
            return term.yellow;
          },
        },
        {
          get(content) {
            if (FlagList[FlagTypes.Icons])
              return appendGlyph(content.name, content.isDir);
            else return content.name;
          },
          width: 30,
          style(item) {
            return item.isDir
              ? term.bold().colorRgb(40, 182, 217)
              : term.bold();
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
              explorer
                .commitAction({
                  name: selectedState.cells.fullPath
                    ? selectedState.cells.fullPath
                    : selectedState.cells.toPath,
                  verb: "open",
                  isDir: selectedState.cells.isDir,
                })
                .then(() => {});
              break;
            case "CTRL_X":
              state = `cut`;
              prevObj = {
                name: selectedState.cells.fullPath
                  ? selectedState.cells.fullPath
                  : selectedState.cells.toPath,
                isDir: selectedState.cells.isDir,
              };
              break;
            case "CTRL_D":
              explorer
                .commitAction({
                  name: selectedState.cells.fullPath
                    ? selectedState.cells.fullPath
                    : selectedState.cells.toPath,
                  verb: "delete",
                  isDir: selectedState.cells.isDir,
                })
                .then((res) => {
                  if (res.redraw) {
                    table.setData(res.contents);
                    table.promise.then(submitCallback);
                  }
                });
              break;
            case "CTRL_C":
              state = `copy`;
              prevObj = {
                name: selectedState.cells.fullPath
                  ? selectedState.cells.fullPath
                  : selectedState.cells.toPath,
                isDir: selectedState.cells.isDir,
              };
              break;
            case "CTRL_P":
              const [verb, from, isDir] =
                state === "cut"
                  ? ["cut", prevObj.name, prevObj.isDir]
                  : ["copy", prevObj.name, prevObj.isDir];
              if (from) {
                explorer
                  .commitAction({
                    from,
                    to: explorer.getFullPath(),
                    verb,
                    isDir,
                  })
                  .then((res) => {
                    if (res.redraw) {
                      table.setData(res.contents);
                      table.promise.then(submitCallback);
                    }
                  });
              }
              break;
          }
        }
      };
    };
    const submitCallback = (item) => {
      explorer
        .commitAction({
          name: item.cells.toPath,
          verb: "submit",
          isDir: item.cells.isDir,
        })
        .then((res) => {
          if (res.redraw) {
            table.setData(res.contents);
            table.promise.then(submitCallback);
          }
        });
    };

    // Logic body
    term.clear(true);
    table = DataTable(term, {
      ...tableConfig,
      data: await explorer.getChildren(),
    });
    table.promise.then(submitCallback);
    table._term.on("key", returnCallBack(table));
  }
})();
