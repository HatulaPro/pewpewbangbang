import * as vscode from 'vscode';
import { Logger } from './logger';
import { Entry, PinnedFilesProvider } from './pinnedFilesProvider';
import { DragAndDropController } from './dragAndDropController';

export async function activate(context: vscode.ExtensionContext) {
	Logger.info('Activated');

	const pinnedFilesProvider = new PinnedFilesProvider();
	await pinnedFilesProvider.sync();
	const watcher = vscode.workspace.createFileSystemWatcher('**/*');

	context.subscriptions.push(
		watcher,
		watcher.onDidDelete((uri) => {
			const uriString = uri.toString();
			if (pinnedFilesProvider.getPinnedFiles().includes(uriString)) {
				Logger.error(`Removed pinned file: ${uriString}`);
				pinnedFilesProvider.setFileAsUnpinned(uriString).then(
					() => Logger.info('File unpinned.'),
					(error) => Logger.error(`Error unpinning file: ${error}`)
				);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pewpewbangbang.closeUnpinnedFiles', () => {
			const pinnedFiles = pinnedFilesProvider.getPinnedFiles();
			const allFiles = vscode.workspace.textDocuments.map((doc) => doc.uri.toString());
			allFiles.forEach((file) => {
				vscode.window.tabGroups.activeTabGroup.tabs.forEach((tab) => {
					if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === file) {
						if (!pinnedFiles.includes(file)) {
							vscode.window.tabGroups.close(tab);
						}
					}
				});
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pewpewbangbang.pinFile', (file?: Entry) => {
			const activeFile = file ?? vscode.window.activeTextEditor?.document;
			if (!activeFile) {
				Logger.error('No active file to pin.');
				return;
			}
			pinnedFilesProvider.setFileAsPinned(activeFile.uri.toString()).then(
				() => Logger.info('File pinned.'),
				(error) => Logger.error(`Error pinning file: ${error}`)
			);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pewpewbangbang.unpinFile', (file) => {
			const activeFile = file ?? vscode.window.activeTextEditor?.document;
			if (!activeFile) {
				Logger.error('No active file to pin.');
				return;
			}
			pinnedFilesProvider.setFileAsUnpinned(activeFile.uri.toString()).then(
				() => Logger.info('File unpinned.'),
				(error) => Logger.error(`Error unpinning file: ${error}`)
			);
		})
	);

	context.subscriptions.push(
		...new Array(PinnedFilesProvider.MAX_PINNED_FILES).fill(0).map((_, index) =>
			vscode.commands.registerCommand(`pewpewbangbang.openPinnedFile${index + 1}`, () => {
				const file = pinnedFilesProvider.getPinnedFiles()[index];
				if (!file) {
					Logger.error(`No pinned file at position ${index + 1}.`);
					return;
				}

				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(file));
			})
		)
	);

	const treeView = vscode.window.createTreeView('pewpewbangbang.section', {
		treeDataProvider: pinnedFilesProvider,
		showCollapseAll: true,
		dragAndDropController: new DragAndDropController(pinnedFilesProvider),
	});
	context.subscriptions.push(treeView);
}
export function deactivate() {}
