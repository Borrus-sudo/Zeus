<p align="center">
  <img width="100px" src="https://api.iconify.design/noto-v1:telescope.svg" align="center" alt="Hero Graph Image" />
  <h1 align="center">Zeus </h1>
  <p align="center"> A modern cross platform `ls` with powerful searching and querying capabilities to scale your productivity to the moon 🚀
  </p>
</p>

## Features
- 💻 A fast cross-platform `ls`
- 🎨 Supports Beautiful Icons via NerdFont
- 📁 Traverse a deeply nested folder structure easily!
- ⚙  Powerful config system which allows you to customize stuff(like opening files in apps)
- 💪 Supports FCD as well!
- 🔎 An inbuilt find command which allows searching files by using the Glob pattern 
- 🧐 Powerful query system which allows you to see what you want
- ✨ Inbuilt support for deleting, copying, pasting files! 
- 📄 Provides extra information about files and folders! 
## First look
![image](https://user-images.githubusercontent.com/58482194/139567326-6e24585b-39cd-4cbc-a828-4f6621bdb6ed.png)
Stay tuned for the demo!

## Docs
- -fd flag, pass a glob pattern to this flag and it shall return all the files matching the pattern from your cwd
- --ls flag, pass this to start zeus in a non-interactie mode
- --icons flag, pass this to get icons based on your file extensions, the icons are customizable via the config file `.zeus.json` in your home directory
- -B flag, pass a date with this flag to display all files created before the passed date
- -A flag, pass a date with this flag to display all files created after the passed date
- -P flag, pass a label with this flag to display all the folders classifying as the label or folders containing these such folders. 
In zeus interactive mode (i.e. when the --ls flag is not passed) you can press `ctrl_o` on a file to open it your preferred app (configurable via `.zeus.json` file). Pressing `ctrl_c` on a folder will copy it and on pressing `ctrl_p` it shall be pasted in your current working directory. `ctrl_o` when pressed on a folder will paste the cd command to that folder in the clipboard which can then be pasted to fcd into it.

## Support me
I am a high schooler doing OSS. Star ⭐ the repo to encourage me to do more OSS stuff!
