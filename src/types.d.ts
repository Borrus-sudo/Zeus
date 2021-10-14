export type contentDescriptor = {
  name: string;
  isDir: Boolean;
  size: string;
  lastModified: string;
  meta:string;
};
export type configDescriptor = {
  flag: "filterExtensions";
  value: string;
};