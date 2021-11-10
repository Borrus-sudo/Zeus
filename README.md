<p align="center">
  <img width="100px" src="https://api.iconify.design/noto-v1:telescope.svg" align="center" alt="Hero Graph Image" />
  <h1 align="center">Zeus </h1>
  <p align="center"> A modern cross platform `ls` with powerful searching and querying capabilities to scale your productivity to the moon 🚀
  </p>
</p>

# Features

- 💻 A fast cross-platform `ls`
- 🎨 Supports Beautiful Icons via NerdFont
- 📁 Traverse a deeply nested folder structure easily!
- ⚙ Powerful config system which allows you to customize stuff(like opening files in apps)
- 💪 Supports FCD as well!
- 🔎 An inbuilt find command which allows searching files by using the Glob pattern
- 🧐 Powerful query system which allows you to see what you want
- ✨ Inbuilt support for deleting, copying, pasting files!
- 📄 Provides extra information about files and folders!

# Docs

## Flags

- **--help** flag to get help
- **-fd** flag, pass a glob pattern to this flag to display all the files matching the glob pattern
- **-B** flag, pass a date with this flag to display all files created before the given date
- **-A** flag, pass a date with this flag to display all files created after the given date
- **-P** flag, pass a label with this flag to display all the folders classifying as the label or folders containing these such folders.
- **--ls** flag, pass this to start Zeus in a non-interactive mode
- **--icons** flag, pass this to get icons based on your file extensions, the icons are customizable via the config file `.zeus.json` in your home directory.
  In Zeus interactive mode (i.e. when the --ls flag is not passed) you can press `ctrl_o` on a file to open it in your preferred app (configurable via `.zeus.json` file). Pressing `ctrl_c` on a folder/file will copy its file path which will be pasted on pressing `ctrl_p` in your current working directory. When `ctrl_o` is pressed on a folder, Zeus will paste the cd command to that folder in the clipboard which can then be pasted in the terminal to FCD into it.

## Config file

```json
   "ignores": [],
   "queryIgnores": [],
   "openFile": "",
   "icons": {}
```

The above JSON file is the default schema of the config file.

- The **ignores** property will take the name of dirent (like .git,node_modules) or a specific directory, and Zeus shall not display it.
- The **queryIgnores** property will take the name of dirent (like .git,node_modules) or a specific directory, and Zeus shall not search within the matching folders or display matching files. Ignoring something does not make it queryIgnore and vice-versa.
- The **openFile** property takes a string in which ${PATH} will be replaced by the file path of the pressed dirent. For e.g. "notepad ${PATH}" or "code ${PATH}". It can also be an object where the value of the matching property based on the file extension will be taken. E.g. {".js":"code ${PATH}","default":"notepad ${PATH}"}. The default property is a fallback if none of the extensions match.
- The **icons** object allows users to prepend a glyph/emoji before specific files,file extensions or folders when --icons flag is passed. for e.g. {".js":"🎄","src/":"🎉"} It is important for folders to have a "/" in the ending.

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

### Tips 💡

- If Zeus runs into an error like ![image](https://user-images.githubusercontent.com/58482194/140915256-eebd0428-194f-4caf-b2ea-e543e401fbe7.png) then add the path, in this case, "D:\Config.Msi", in queryIgnores and ignores in the config file
- Zeus interactive mode has a type-to-search feature inbuilt!

# First look

![image](https://user-images.githubusercontent.com/58482194/139567326-6e24585b-39cd-4cbc-a828-4f6621bdb6ed.png)

## Support me

I am a high schooler doing OSS. Star ⭐ the repo to encourage me to do more OSS stuff!
