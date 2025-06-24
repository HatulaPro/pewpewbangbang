import * as vscode from 'vscode';
import { Logger } from './logger';

export interface Entry {
	uri: vscode.Uri;
	type: vscode.FileType;
}

export class PinnedFilesProvider implements vscode.TreeDataProvider<Entry> {
	static MAX_PINNED_FILES = 5;
	public dataChangedEventEmitter: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<void | Entry | Entry[] | null | undefined> = this.dataChangedEventEmitter.event;
	private activeUri?: string;

	getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const index = this.getPinnedFiles().indexOf(element.uri.toString());
		const label = `${index + 1}: ${element.uri.path.split('/').pop() || 'Unknown'}`;
		return {
			label: {
				label,
				highlights: this.activeUri === element.uri.toString() ? [[0, label.length]] : [],
			},
			resourceUri: element.uri,
			command: {
				title: 'Open File',
				command: 'vscode.open',
				arguments: [element.uri],
			},
			contextValue: `${index}`,
			tooltip: element.uri.path,
		};
	}
	getChildren(element?: Entry | undefined): vscode.ProviderResult<Entry[]> {
		if (element) {
			return [];
		}
		const pinnedFiles = this.getPinnedFiles();
		if (pinnedFiles.length > 0) {
			return Promise.all(
				pinnedFiles.map(async (file) => {
					const uri = vscode.Uri.parse(file);
					const type = await vscode.workspace.fs.stat(uri).then((stat) => stat.type);
					return { uri, type };
				})
			);
		}
	}
	getParent?(element: Entry): vscode.ProviderResult<Entry> {
		return null;
	}
	resolveTreeItem?(item: vscode.TreeItem, element: Entry, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
		throw new Error('Method not implemented.');
	}
	public setActiveUri(uri?: string) {
		this.activeUri = uri;
		this.dataChangedEventEmitter.fire(null);
	}
	public getActiveUri(uri?: string) {
		this.activeUri = uri;
	}
	public getPinnedFiles(): string[] {
		const currentDocument = vscode.window.activeTextEditor?.document.uri ?? null;
		return vscode.workspace
			.getConfiguration('pewpewbangbang', currentDocument ? vscode.workspace.getWorkspaceFolder(currentDocument) : null)
			.get<string[]>('pinnedFiles', [])
			.slice(0, PinnedFilesProvider.MAX_PINNED_FILES);
	}
	public async setFileAsPinned(file: string): Promise<void> {
		const pinnedFiles = this.getPinnedFiles();
		if (pinnedFiles.includes(file)) throw new Error('File is already pinned.');
		if (pinnedFiles.length >= PinnedFilesProvider.MAX_PINNED_FILES) throw new Error(`Can not pin more than ${PinnedFilesProvider.MAX_PINNED_FILES} files.`);

		return this.setPinnedFiles([file, ...pinnedFiles]);
	}
	public async setFileAsUnpinned(file: string): Promise<void> {
		const pinnedFiles = this.getPinnedFiles();
		if (!pinnedFiles.includes(file)) throw new Error('File is already unpinned.');

		return this.setPinnedFiles(pinnedFiles.filter((uri) => uri !== file));
	}
	public async setPinnedFiles(files: string[]): Promise<void> {
		const currentDocument = vscode.window.activeTextEditor?.document.uri ?? null;

		return new Promise((res) =>
			vscode.workspace
				.getConfiguration('pewpewbangbang', currentDocument ? vscode.workspace.getWorkspaceFolder(currentDocument) : null)
				.update('pinnedFiles', files)
				.then(() => {
					this.dataChangedEventEmitter.fire(null);
					res(undefined);
				})
		);
	}
	public sync(): Promise<any> {
		const pinnedFiles = this.getPinnedFiles();

		const unpinBrokenFile = async (file: string) => {
			await this.setFileAsUnpinned(file).then(
				() => Logger.info('File unpinned.'),
				(error) => Logger.error(`Error unpinning file: ${error}`)
			);
		};
		return Promise.all([
			pinnedFiles.map(
				(file) =>
					new Promise((res, rej) =>
						vscode.workspace.fs.stat(vscode.Uri.parse(file)).then(
							async (result) => {
								if (result.type === vscode.FileType.File) {
									res(null);
								} else {
									await unpinBrokenFile(file);
									rej(new Error(`File not found: ${file}`));
								}
							},
							async () => {
								await unpinBrokenFile(file);
								rej(new Error(`File not found: ${file}`));
							}
						)
					)
			),
		]);
	}
	handleFileHighlighting() {}
}
