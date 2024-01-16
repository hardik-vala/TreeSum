import * as vscode from "vscode";

export class WorkspaceTreeSummariesProvider
  implements vscode.TreeDataProvider<WorkspaceTreeSummariesItem>
{
  constructor(private workspaceRootPath: string | undefined) {}

  getTreeItem(element: WorkspaceTreeSummariesItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: WorkspaceTreeSummariesItem
  ): Thenable<WorkspaceTreeSummariesItem[]> {
    if (!element && this.workspaceRootPath) {
      return this.getChildrenInDir(this.workspaceRootPath);
    }

    if (element && element.isDir) {
      return this.getChildrenInDir(element.uri);
    }

    return Promise.resolve([]);
  }

  private async getChildrenInDir(
    dirPath: string
  ): Promise<WorkspaceTreeSummariesItem[]> {
    const dirUri = vscode.Uri.file(dirPath);
    return vscode.workspace.fs.readDirectory(dirUri).then((items) => {
      return items.map((item) => {
        return new WorkspaceTreeSummariesItem(
          item[0],
          item[1] === vscode.FileType.Directory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
          "DESCRIPTION GOES HERE",
          "TOOLTIP GOES HERE",
          vscode.Uri.joinPath(dirUri, item[0]).fsPath,
          item[1] === vscode.FileType.Directory
        );
      });
    });
  }
}

export class WorkspaceTreeSummariesItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly description: string,
    public readonly tooltip: string,
    public readonly uri: string,
    public readonly isDir: boolean
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
    this.uri = uri;
    this.isDir = isDir;
  }
}