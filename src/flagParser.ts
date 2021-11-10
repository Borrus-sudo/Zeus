import { normalize, resolve } from "path";
import { argv } from "process";
import { flagDescriptor, FlagTypes } from "./types";
function getFlags(): flagDescriptor[] {
  let arg: string[] = argv.slice(2);
  const flagTypes: flagDescriptor[] = [];

  for (let i = 0; i < arg.length; i++) {
    const flag = arg[i];
    let val: string;
    switch (flag) {
      case "-P":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;
        flagTypes[FlagTypes.FilterExtension] = {
          flag: "filterExtensions",
          value: val,
        };
        break;

      case "-B":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;
        flagTypes[FlagTypes.Before] = { flag: "before", value: val };
        break;

      case "-A":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;
        flagTypes[FlagTypes.After] = { flag: "after", value: val };
        break;

      case "-R":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;
        flagTypes[FlagTypes.Regex] = { flag: "regex", value: val };
        break;

      case "-fd":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;
        flagTypes[FlagTypes.Find] = { flag: "find", value: val };
        break;

      case "-gi":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;

        flagTypes[FlagTypes.GIgnore] = {
          flag: "globalIgnore",
          value: val
            .split(",")
            .map((_) =>
              _.startsWith("./") ? resolve(process.cwd(), _) : normalize(_)
            )
            .join(","),
        };
        break;

      case "-qi":
        val = String(arg[i + 1]);
        if (val === "undefined") {
          console.log(`No argument provided to the ${flag} flag`);
          process.exit();
        }
        i++;

        flagTypes[FlagTypes.QIgnore] = {
          flag: "queryIgnore",
          value: val
            .split(",")
            .map((_) =>
              _.startsWith("./") ? resolve(process.cwd(), _) : normalize(_)
            )
            .join(","),
        };
        break;

      case "--icons":
        flagTypes[FlagTypes.Icons] = { flag: "icons", value: val };
        break;

      case "--ls":
        flagTypes[FlagTypes.LS] = { flag: "ls", value: val };
        break;

      case "--help":
        const heading = String.raw`
 ________   _______  __    __       _______.
|       /  |   ____||  |  |  |     /       |
 ---/  /   |  |__   |  |  |  |    |    (----
   /  /    |   __|  |  |  |  |     \   \    
  /  /----.|  |____ |  ---   | .----)   |   
 /________||_______| \______/  |_______/    
`;
        console.log(heading + "\n");
        const flagInfo = `-fd flag, pass a glob pattern to this flag to display all the files matching the glob pattern \n-B flag, pass a date with this flag to display all files created before the given date\n-A flag, pass a date with this flag to display all files created after the given date\n-P flag, pass a label with this flag to display all the folders classifying as the label or folders containing these such folders.\n--ls flag, pass this to start Zeus in a non-interactive mode\n--icons flag, pass this to get icons based on your file extensions, the icons are customizable via the config file`;
        console.log(flagInfo);
        process.exit();
    }
  }
  return flagTypes;
}

export default getFlags();
