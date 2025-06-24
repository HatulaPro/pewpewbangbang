import * as vscode from 'vscode';
import { PinnedFilesProvider, Entry } from './pinnedFilesProvider';

export class DragAndDropController implements vscode.TreeDragAndDropController<Entry> {
	public dropMimeTypes: readonly string[];
	public dragMimeTypes: readonly string[];
	private dragging?: Entry | undefined;

	constructor(private pinnedFilesProvider: PinnedFilesProvider) {
		this.dropMimeTypes = ['application/vnd.code.tree.pinnedfile'];
		this.dragMimeTypes = ['application/vnd.code.tree.pinnedfile'];
	}

	handleDrag(source: readonly Entry[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Thenable<void> | void {
		this.dragging = source[0];
		token.onCancellationRequested(() => {
			this.dragging = undefined;
		});
	}

	handleDrop(target: Entry | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Thenable<void> | void {
		if (!this.dragging) return;

		const pinnedFiles = this.pinnedFilesProvider.getPinnedFiles();
		const sourceIndex = pinnedFiles.indexOf(this.dragging.uri.toString());
		this.dragging = undefined;
		if (sourceIndex === -1) return;
		const source = pinnedFiles[sourceIndex];

		const targetIndex = target ? pinnedFiles.indexOf(target.uri.toString()) : pinnedFiles.length - 1;
		if (targetIndex === -1) return;
		if (sourceIndex === targetIndex) return;

		pinnedFiles.splice(sourceIndex, 1);
		if (targetIndex > sourceIndex) {
			pinnedFiles.splice(targetIndex, 0, source);
		} else {
			pinnedFiles.splice(targetIndex, 0, source);
		}
		return this.pinnedFilesProvider.setPinnedFiles(pinnedFiles);
	}
}
