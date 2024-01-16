import * as vscode from "vscode";
import { WorkspaceTreeSummariesProvider } from "./tree";
import { getWorkspaceRootPath } from "./workspace";
import LLMService from './llmService'; // Adjust the path as necessary

export function activate(context: vscode.ExtensionContext) {
  const workspaceRootPath = getWorkspaceRootPath();
	const apiKey = vscode.workspace.getConfiguration('treesum').get<string>('apiKey');
	if (!apiKey) {
    vscode.window.showWarningMessage('Please set your LLMService API key in the settings.');
    return;
  }

	// TODO: write VSCode config/interface for user to provide their own API key.
	const llmService = new LLMService(apiKey);
    
  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: new WorkspaceTreeSummariesProvider(workspaceRootPath),
  });

  // The command has been defined in the package.json file.
  // The commandId parameter must match the command field in package.json.
  let disposable = vscode.commands.registerCommand("treesum.helloWorld", () => {
    // Display a message box to the user.
    vscode.window.showInformationMessage("Hello World from TreeSum!");

		llmService.summarizeSrcDir();
  });

  context.subscriptions.push(disposable);
}


export function deactivate() {}
