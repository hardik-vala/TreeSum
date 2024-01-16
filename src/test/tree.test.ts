import * as assert from "assert";
import * as vscode from "vscode";
import {
  WorkspaceTreeSummariesItem,
  WorkspaceTreeSummariesProvider,
} from "../tree";
import { getWorkspaceRootPath } from "../workspace";

suite("WorkspaceTreeSummariesProvider Test Suite", () => {
  const workspaceRootUri = getWorkspaceRootUri();
  const provider: WorkspaceTreeSummariesProvider =
    new WorkspaceTreeSummariesProvider(workspaceRootUri.fsPath);

  test("getTreeItem", () => {
    const item = new WorkspaceTreeSummariesItem(
      "test_file_1.txt",
      vscode.TreeItemCollapsibleState.None,
      "DESCRIPTION GOES HERE",
      "TOOLTIP GOES HERE",
      vscode.Uri.joinPath(workspaceRootUri, "test_file_1.txt").fsPath,
      false
    );
    const treeItem = provider.getTreeItem(item);
    assert.strictEqual(treeItem, item);
  });

  test("getChildren(root)", async () => {
    const children = await provider.getChildren();

    assert.deepStrictEqual(children, [
      new WorkspaceTreeSummariesItem(
        "test_file_1.txt",
        vscode.TreeItemCollapsibleState.None,
        "DESCRIPTION GOES HERE",
        "TOOLTIP GOES HERE",
        vscode.Uri.joinPath(workspaceRootUri, "test_file_1.txt").fsPath,
        false
      ),
      new WorkspaceTreeSummariesItem(
        "test_subdir",
        vscode.TreeItemCollapsibleState.Collapsed,
        "DESCRIPTION GOES HERE",
        "TOOLTIP GOES HERE",
        vscode.Uri.joinPath(workspaceRootUri, "test_subdir").fsPath,
        true
      ),
    ]);
  });

  test("getChildren(subdir)", async () => {
    const item = new WorkspaceTreeSummariesItem(
      "test_subdir",
      vscode.TreeItemCollapsibleState.Collapsed,
      "DESCRIPTION GOES HERE",
      "TOOLTIP GOES HERE",
      vscode.Uri.joinPath(workspaceRootUri, "test_subdir").fsPath,
      true
    );
    const children = await provider.getChildren(item);

    assert.deepStrictEqual(children, [
      new WorkspaceTreeSummariesItem(
        "test_file_2.txt",
        vscode.TreeItemCollapsibleState.None,
        "DESCRIPTION GOES HERE",
        "TOOLTIP GOES HERE",
        vscode.Uri.joinPath(
          vscode.Uri.joinPath(workspaceRootUri, "test_subdir"),
          "test_file_2.txt"
        ).fsPath,
        false
      ),
      new WorkspaceTreeSummariesItem(
        "test_file_3.txt",
        vscode.TreeItemCollapsibleState.None,
        "DESCRIPTION GOES HERE",
        "TOOLTIP GOES HERE",
        vscode.Uri.joinPath(
          vscode.Uri.joinPath(workspaceRootUri, "test_subdir"),
          "test_file_3.txt"
        ).fsPath,
        false
      ),
    ]);
  });
});

function getWorkspaceRootUri(): vscode.Uri {
  const path = getWorkspaceRootPath();
  if (!path) {
    throw new Error("No workspace folders found");
  }

  return vscode.Uri.file(path);
}
