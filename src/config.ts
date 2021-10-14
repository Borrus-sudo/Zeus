import { argv } from "process";
import { configDescriptor } from "./types";
export default function (): configDescriptor[] {
  let arg: string[] = argv.slice(2);
  const flagTypes: configDescriptor[] = [];
  for (let i = 0; i < arg.length - 1; i++) {
    const flag = arg[i],
      val = String(arg[i + 1]);
    if (flag == "-E") {
      flagTypes.push({ flag: "filterExtensions", value:val });
    }
  }
  return flagTypes;
}
