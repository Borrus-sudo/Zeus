const events = require("events");

const defaultKeyBindings = {
    ENTER: "submit",
    KP_ENTER: "submit",
    UP: "previousRow",
    DOWN: "nextRow",
    LEFT: "previousCol",
    RIGHT: "nextCol",
    TAB: "nextRow",
    SHIFT_TAB: "previousRow",
    HOME: "firstRow",
    END: "lastRow",
    BACKSPACE: "deleteLetter",
    ESCAPE: "cancel",
};

function getColumn(getMethod, targetItem) {
    let getter;
    if (typeof getMethod === "string") {
        getter = (item) => item[String(getMethod)];
    } else {
        getter = getMethod;
    }
    return getter(targetItem);
}
class TableConfig {
    constructor(terminal, options) {
        options.width = options.width || terminal.width;
        options.height = options.height || terminal.height;
        this.keyBindings = options.keyBindings || defaultKeyBindings;
        if (!options.allowCancel) {
            delete this.keyBindings.ESCAPE;
        }
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.style = {
            default: options.style || terminal.bgBlack.brightWhite,
            selected: options.selectedStyle || terminal.bgBrightYellow.black,
        };
        this.scrollPadding = options.scrollPadding || 3;
        this.padding = options.padding || 1;
        this.columns = options.columns || [];
        this.columns.forEach((col) => {
            if (typeof col.get === "string") {
                const getStr = col.get;
                col.get = (item) => {
                    return item[getStr];
                };
            } else if (typeof col.get !== "function") {
                throw Error('Columns must define a "get" property.');
            }
        });
        this.filterTextSize = options.filterTextSize || 16;
    }
}
class RowItem {
    constructor(index, data) {
        this.cells = data;
        this.visible = true;
        this.index = index;
    }
}
class TableState extends events.EventEmitter {
    constructor(config, options) {
        super();
        this.paused = false;
        this.displayArea = {
            x: 1,
            y: 1,
            width: 0,
            height: 0,
            xScroll: 0,
            yScroll: 0,
        };
        this._filter = "";
        this.config = config;
        this.paused = options.paused || false;
        this.displayArea.x = options.x || 1;
        this.displayArea.y = options.y || 1;
        this.displayArea.width = options.width || 0;
        this.displayArea.height = options.height || 0;
        this.data = options.data || [];
    }
    get items() {
        return this.data;
    }
    set items(items) {
        this.data = [];
        let i = 0;
        items.forEach((item) => {
            this.data.push(new RowItem(i, item));
            i++;
        });
        this.refilter();
        this.emit("change");
    }
    get filter() {
        return String(this._filter);
    }
    set filter(text) {
        this._filter = String(text).slice(0, this.config.filterTextSize);
        this.refilter();
        this.emit("change");
    }
    get selectedIndex() {
        return this._selected;
    }
    set selectedIndex(index) {
        if (index !== undefined && this.data[index] === undefined) {
            index = undefined;
        }
        this._selected = index;
        this.emit("change");
    }
    get selected() {
        if (this._selected !== undefined) {
            return this.data[this._selected];
        }
        return null;
    }
    set selected(item) {
        if (item === undefined) {
            if (this._selected && this.data[this._selected].visible === false) {
                this.selectedIndex = undefined;
            }
        } else {
            this.selectedIndex = item.index;
        }
    }
    getFilteredItems() {
        return this.items.filter((item) => item.visible);
    }
    refilter() {
        this.items.forEach((item) => {
            const found = this.config.columns.find((column) => {
                if (typeof this.config.filter === "function") {
                    return this.config.filter(this.filter, item);
                } else {
                    return (
                        String(getColumn(column.get, item.cells))
                        .toUpperCase()
                        .indexOf(this.filter.toUpperCase()) > -1
                    );
                }
            });
            item.visible = found !== undefined;
        });
    }
}
class DataTable extends events.EventEmitter {
    constructor(terminal, options) {
        super();
        this.options = options;
        this.grabbing = false;
        this._term = terminal;
        this._config = new TableConfig(this._term, options);
        this._state = new TableState(this._config, options);
        this.setData(options.data || []);
        this._events = {
            onKeyPress: this.onKeyPress.bind(this),
            redraw: this.redraw.bind(this),
        };
        this._state.on("change", this._events.redraw.bind(this));
        this._term.on("key", this._events.onKeyPress.bind(this));
        if (!this.grabbing) {
            this._term.grabInput(true);
        }
        this.promise = new Promise((resolve, reject) => {
            this._state.resolve = resolve;
            this._state.reject = reject;
            if (this._state.data.length) {
                this.redraw();
            }
            this.emit("ready");
        });
    }
    setSelected(item) {
        this._state.selected = item;
    }
    submit(isSubmit) {
        const data = isSubmit ? this._state.selected : null;
        this._destroy();
        if (this._state.resolve) {
            this._state.resolve(data);
        }
    }
    onKeyPress(key) {
        if (this._state.paused) {
            return;
        }
        if (key === "ESCAPE") {
            process.exit();
        }
        const items = this._state.getFilteredItems();
        const selectedItemIndex = items.findIndex(
            (item) => item.index === this._state.selectedIndex
        );
        switch (this._config.keyBindings[key]) {
            case "submit":
                this.submit(true);
                break;
            case "previousRow":
                this.setSelected(items[selectedItemIndex - 1]);
                break;
            case "nextRow":
                this.setSelected(items[selectedItemIndex + 1]);
                break;
            case "firstRow":
                this.setSelected(items[0]);
                break;
            case "nextCol":
                break;
            case "previousCol":
                break;
            case "lastRow":
                this.setSelected(items[items.length - 1]);
                break;
            case "cancel":
                this.submit(false);
                break;
            case "deleteLetter":
                this._state.filter = this._state.filter.slice(0, -1);
                break;
            default:
                if (key.length === 1) {
                    this._state.filter += key;
                }
                break;
        }
    }
    redraw() {
        if (this._state.paused) {
            return;
        }
        if (this._config.y !== undefined) {
            this._term.moveTo(1, this._config.y);
        }
        const filterHeight = 2;
        const filteredItems = this._state.getFilteredItems();
        if (
            filteredItems.length &&
            filteredItems.filter((item) => item.index === this._state.selectedIndex)
            .length === 0
        ) {
            this._state.selectedIndex = filteredItems[0].index;
        }
        let height = this._state.displayArea.height - filterHeight;
        if (filteredItems.length > height) {
            height -= 2;
        }
        let pos = 0;
        filteredItems.forEach((item) => {
            if (item.index === this._state.selectedIndex) {
                if (pos < this._state.displayArea.yScroll) {
                    this._state.displayArea.yScroll = pos;
                }
                if (pos >= this._state.displayArea.yScroll + height) {
                    this._state.displayArea.yScroll = 1 + (pos - height);
                }
            }
            pos++;
        });
        const visibleItems = filteredItems.slice(
            this._state.displayArea.yScroll,
            this._state.displayArea.yScroll + height
        );
        let cursorPos = this._state.displayArea.y;
        this._term.moveTo(this._state.displayArea.x, cursorPos);
        cursorPos += filterHeight;
        this._term.moveTo(this._state.displayArea.x, cursorPos++);
        if (this._state.displayArea.yScroll > 0) {} else {
            this._config.style.default(
                String().padEnd(this._state.displayArea.width, " ")
            );
        }
        let row = 0;
        visibleItems.forEach((item) => {
            row++;
            this._term.moveTo(this._state.displayArea.x, cursorPos++);
            this._config.columns.forEach((column) => {
                let output = this._config.style.default;
                if (this._state.selectedIndex === item.index) {
                    output = this._config.style.selected;
                } else if (typeof column.style === "function") {
                    output = column.style(item.cells);
                }
                const text = String(getColumn(column.get, item.cells))
                    .slice(0, column.width)
                    .padEnd(column.width + this._config.padding, " ")
                    .padStart(column.width + this._config.padding * 2, " ");
                output(text);
            });
        });
        for (; row < height; row++) {
            this._term.moveTo(this._state.displayArea.x, cursorPos++);
            this._config.style.default(
                String().padEnd(this._state.displayArea.width, " ")
            );
        }
        this._term.moveTo(this._state.displayArea.x, cursorPos++);
    }
    abort() {
        this._state.paused = true;
        this._destroy();
    }
    pause() {
        this._state.paused = true;
    }
    resume() {
        this._state.paused = false;
    }
    focus(giveFocus = true) {
        if (giveFocus) {
            this.resume();
        } else {
            this.pause();
        }
    }
    setData(data) {
        this._state.items = data;
    }
    _destroy() {
        this._term.off("key", this._events.onKeyPress);
        this.pause();
    }
}

function DataTableFactory(terminal, options) {
    return new DataTable(terminal, options);
}
exports.DataTableFactory = DataTableFactory;