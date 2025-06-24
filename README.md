# pewpewbangbang

A VSCode extension for easier file navigation. Allows you to pin files to be more accessible later.

## How Does It Work?

When working on a feature for your project, usually there are very few files that you have to work with continously. By [pinning](#pin-file) the files you can save them in an easy-to-access store. You can then set keybinds to open those quickly.

## Commands

These are all commands that can be run using `Ctrl + Shift + P + <command_name>`. I recommend you add keybinds to the ones you find useful.

### Pin File

Command name: `pewpewbangbang.pinFile`

-   Saves the file in the pinned files list.

### Unpin File

Command name: `pewpewbangbang.unpinFile`

-   Removes a file from the pinned files list.

### Open Pinned File 1-5

Command name: `pewpewbangbang.openPinnedFileX` (X: number between 1-5)

-   Opens the file in your editor based on its position in the list (1 indexed).

### Close Unpinned Files

Command name: `pewpewbangbang.closeUnpinnedFiles` (X: number between 1-5)

-   Closes all tabs of files not in the pinned files list. Only in the current active tab group.

## Configuration

### Verbosity

type: `none` | `debug`

-   Use `none` for no logging, or debug for more detailed messages. Recommended to use `none`, debug is annoying.
