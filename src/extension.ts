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
      "Error: Please set treesum.apiKey in the settings."
    );
    return;
  }

  const modelKey = vscode.workspace
    .getConfiguration("treesum")
    .get<string>("model");
  if (!modelKey) {
    vscode.window.showErrorMessage(
      "Error: Please set treesum.model in the settings."
    );
    return;
  }

  const openaiClient = new OpenAIClient(apiKey, modelKey);

  const workspaceTreeSummariesProvider = new WorkspaceTreeSummariesProvider(
    workspaceRootPath,
    new LLMService(openaiClient)
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
