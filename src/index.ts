import * as fs from "fs";
import { terminal as term } from "terminal-kit";
import * as plugins from "terminal-kit-plugins";

const ignore = ["node_modules", ".git"];
const flattenDirectory = (dir, paddingCount = 1) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((elem) => !ignore.includes(elem))
        .map((elem) => ({
          name: " ".repeat(paddingCount) + elem,
          isDir: fs.statSync(elem).isDirectory(),
        }))
    : [];
plugins.plugin(term);
const items = [
  {
    name: "../",
    isDir: true,
  },
  ...flattenDirectory(process.cwd()),
];
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

table.setData(items);
table.promise.then((item) => {
  console.log("Selected: " + item.name);
  table.setData([{ name: "Crap", isDir: true }]);
  table.promise.then((item) => {
    console.log(item);
  });
});
table._term.on("key", (key) => {
  console.log(key);
  console.log(table._state.selected);
});
table._state.on("change", (newState) => {
  console.log(newState);
});
