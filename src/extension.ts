import * as vscode from "vscode";
import { WorkspaceTreeSummariesProvider } from "./tree";
import { getWorkspaceRootPath } from "./workspace";

export function activate(context: vscode.ExtensionContext) {
  const workspaceRootPath = getWorkspaceRootPath();

  const workspaceTreeSummariesProvider = new WorkspaceTreeSummariesProvider(
    workspaceRootPath
  );
  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: workspaceTreeSummariesProvider,
  });
  vscode.commands.registerCommand("treesum.refresh", () => {
    workspaceTreeSummariesProvider.refresh();
		vscode.window.showInformationMessage("Refreshed file and folder summaries.");
	});

  // The command has been defined in the package.json file.
  // The commandId parameter must match the command field in package.json.
  let disposable = vscode.commands.registerCommand("treesum.helloWorld", () => {
    // Display a message box to the user.
    vscode.window.showInformationMessage("Hello World from TreeSum!");
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
