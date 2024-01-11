// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import LLMService from './llmService'; // Adjust the path as necessary

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "treesum" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('treesum.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from TreeSum!');

		summarizeSrcDir();
	});

	context.subscriptions.push(disposable);
}

async function summarizeSrcDir() {
	if(vscode.workspace.workspaceFolders !== undefined) {
		let wf = vscode.workspace.workspaceFolders[0].uri.path ;
		let f = vscode.workspace.workspaceFolders[0].uri.fsPath ; 

		if (vscode.workspace.workspaceFolders.length === 1) {
			let topLevelFolder = vscode.workspace.workspaceFolders[0];
			let topLevelFolderContents = await vscode.workspace.fs.readDirectory(topLevelFolder.uri);

			const topLevelContentsNames = topLevelFolderContents.map(([name, type]) => {
				return name;
			});

			let contentsMessage = `TREE-SUM: folders: ${topLevelContentsNames.join(', ')}`; ;
			vscode.window.showInformationMessage(contentsMessage);

			// TODO: add code to summarize the toplevel directory based on
			// the names of its contents
      // TODO: Add your OpenAI API key
			const llmService = new LLMService('YOUR_API_KEY_HERE');

			try {
				const summary = await llmService.summarizeContent(topLevelContentsNames.join(', '));
				vscode.window.showInformationMessage(summary);
			} catch (error) {
				vscode.window.showErrorMessage(`Error summarizing content: ${error}`);
			}

		}
	} 
	else {
			let message = "YOUR-EXTENSION: Working folder not found, open a folder an try again" ;

			vscode.window.showErrorMessage(message);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
