# 📁 Configuration file

```json
   "ignores": [],
   "queryIgnores": [],
   "openFile": "",
   "icons": {},
   "labels":[]
```

The above JSON file is the default schema of the config file.

- The **ignores** property will take the name of dirent (like .git,node_modules) or a specific directory, and Zeus shall not display it.
- The **queryIgnores** property will take the name of dirent (like .git,node_modules) or a specific directory, and Zeus shall not search within the matching folders or display matching files. Ignoring something does not make it queryIgnore and vice-versa.
- The **openFile** property takes a string in which ${PATH} will be replaced by the file path of the pressed dirent. For e.g. "notepad ${PATH}" or "code ${PATH}". It can also be an object where the value of the matching property based on the file extension will be taken. E.g. {".js":"code ${PATH}","default":"notepad ${PATH}"}. The default property is a fallback if none of the extensions match.
- The **icons** object allows users to prepend a glyph/emoji before specific files,file extensions or folders when --icons flag is passed. for e.g. {".js":"🎄","src/":"🎉"} It is important for folders to have a "/" in the ending.
- The **labels** property is an array of objects of the schema `json {label: string, matchers: string[]} `. The label is the name property is passed to the **-P** flag to display all the folders or folders containing such folders that will match all the glob patterns in the `matchers` property.

### Config file example

```json
{
  "ignores": [".git", "node_modules", "D:/Config.Msi"],
  "queryIgnores": ["D:/Config.Msi"],
  "openFile": {
    ".js": "code ${PATH}",
    "default": "notepad ${PATH}"
  },
  "icons": {
    ".js": "🎄",
    "src/": "🎉",
    "package.json": "📦"
  }
}
```