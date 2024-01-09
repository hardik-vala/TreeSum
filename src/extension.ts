import * as vscode from "vscode";
import { WorkspaceTreeSummariesProvider } from "./tree";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "treesum" is now active!');

  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: new WorkspaceTreeSummariesProvider(),
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
