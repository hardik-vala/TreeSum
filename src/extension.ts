import * as vscode from "vscode";
import { WorkspaceTreeSummariesProvider } from "./tree";
import { getWorkspaceRootPath } from "./workspace";

export function activate(context: vscode.ExtensionContext) {
  const workspaceRootPath = getWorkspaceRootPath();

  const apiKey = vscode.workspace
    .getConfiguration("treesum")
    .get<string>("apiKey");
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Error: Please set your LLMService API key in the settings."
    );
    return;
  }

  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: new WorkspaceTreeSummariesProvider(workspaceRootPath),
  });

  const workspaceTreeSummariesProvider = new WorkspaceTreeSummariesProvider(
    workspaceRootPath
  );
  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: workspaceTreeSummariesProvider,
  });
  let disposable = vscode.commands.registerCommand("treesum.refresh", () => {
    workspaceTreeSummariesProvider.refresh();
		vscode.window.showInformationMessage("Refreshed file and folder summaries.");
	});

  context.subscriptions.push(disposable);
}

export function deactivate() {}
