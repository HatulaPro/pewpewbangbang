import * as vscode from 'vscode';

export class Logger {
	private static isVerbose() {
		return vscode.workspace.getConfiguration('pewpewbangbang').get<'debug' | 'none'>('verbosity') === 'debug';
	}

	static info(message: string) {
		console.log(`[INFO] ${message}`);
		if (Logger.isVerbose()) {
			vscode.window.showInformationMessage(message);
		}
	}

	static error(message: string) {
		console.error(`[ERROR] ${message}`);
		if (Logger.isVerbose()) {
			vscode.window.showErrorMessage(message);
		}
	}
}
