import { argv } from "process";
import { configDescriptor, FlagTypes } from "./types";
export default function (): configDescriptor[] {
  let arg: string[] = argv.slice(2);
  const flagTypes: configDescriptor[] = [];
  for (let i = 0; i < arg.length - 1; i++) {
    const flag = arg[i],
      val = String(arg[i + 1]);
    if (flag === "-P") {
      flagTypes[FlagTypes.FilterExtension] = {
        flag: "filterExtensions",
        value: val,
      };
    } else if (flag === "-G") {
      flagTypes[FlagTypes.Gitignore] = { flag: "gitignore", value: "" };
    } else if (flag === "-B") {
      flagTypes[FlagTypes.Before] = { flag: "before", value: val };
    } else if (flag === "-A") {
      flagTypes[FlagTypes.After] = { flag: "after", value: val };
    } else if (flag === "-R") {
      flagTypes[FlagTypes.Regex] = { flag: "regex", value: val };
    }
  }
  return flagTypes;
}
