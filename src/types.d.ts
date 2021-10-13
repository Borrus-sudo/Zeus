export type contentDescriptor = {
  name: string;
  isDir: Boolean;
  size: string;
  lastModified: string;
};
export type configDescriptor = {
  flag: "filter";
  value: RegExp;
};