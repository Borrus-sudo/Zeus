import { argv } from "process";
import { configDescriptor, FlagTypes } from "./types";
export default function (): configDescriptor[] {
  let arg: string[] = argv.slice(2);
  const flagTypes: configDescriptor[] = [];
  for (let i = 0; i < arg.length - 1; i++) {
    const flag = arg[i],
      val = String(arg[i + 1]);
    switch (flag) {
      case "-P":
        flagTypes[FlagTypes.FilterExtension] = {
          flag: "filterExtensions",
          value: val,
        };
        break;
      case "-G":
        flagTypes[FlagTypes.Gitignore] = { flag: "gitignore", value: "" };
        break;
      case "-B":
        flagTypes[FlagTypes.Before] = { flag: "before", value: val };
        break;
      case "-A":
        flagTypes[FlagTypes.After] = { flag: "after", value: val };
        break;
      case "-R":
        flagTypes[FlagTypes.Regex] = { flag: "regex", value: val };
        break;
      case "-ls":
        flagTypes[FlagTypes.LS] = { flag: "ls", value: "" };
        break;
    }
  }
  return flagTypes;
}
