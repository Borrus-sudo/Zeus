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
      case "--icons":
        flagTypes[FlagTypes.Icons] = { flag: "icons", value: val };
        break;
      case "--ls":
        flagTypes[FlagTypes.LS] = { flag: "ls", value: val };
    }
  }
  return flagTypes;
}

export default getFlags();
