import * as vscode from "vscode";
import LLMService from "./llmService";
import OpenAIClient from "./openaiClient";
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

  const openaiClient = new OpenAIClient(apiKey);

  vscode.window.createTreeView("workspaceTreeSummaries", {
    treeDataProvider: new WorkspaceTreeSummariesProvider(
      workspaceRootPath,
      new LLMService(openaiClient)
    ),
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
