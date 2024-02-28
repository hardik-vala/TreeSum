import * as path from "path";
import * as vscode from "vscode";
import LLMService from "./llmService";

const ICONS_DIR_PATH: string = path.join(
  __filename,
  "..",
  "..",
  "resources",
  "icons"
);
const DIR_ICON_PATH = path.join(ICONS_DIR_PATH, "default_folder.svg");
const FILE_ICON_PATH = path.join(ICONS_DIR_PATH, "default_file.svg");

export class WorkspaceTreeSummariesProvider
  implements vscode.TreeDataProvider<WorkspaceTreeSummariesItem>
{
  private llmService?: LLMService;

  constructor(private workspaceRootPath: string | undefined) {
    const apiKey = vscode.workspace.getConfiguration('treesum').get<string>('apiKey');
    if (!apiKey) {
      vscode.window.showWarningMessage('Please set your LLMService API key in the settings.');
      return;
    }
    this.llmService = new LLMService(apiKey);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    WorkspaceTreeSummariesItem | undefined | null | void
  > = new vscode.EventEmitter<
    WorkspaceTreeSummariesItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    WorkspaceTreeSummariesItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

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
      return Promise.all(items.map(async (item) => {
        const name = item[0];
        const summary = await this.llmService?.summarizeFileOrDirectory(dirUri, name);
        return new WorkspaceTreeSummariesItem(
          name,
          item[1] === vscode.FileType.Directory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
          summary === undefined ? "AWAITING SUMMARY" : summary,
          summary === undefined ? "AWAITING SUMMARY" : summary,
          vscode.Uri.joinPath(dirUri, item[0]).fsPath,
          item[1] === vscode.FileType.Directory
        );
      }));
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

    this.iconPath = this.isDir
      ? {
          light: DIR_ICON_PATH,
          dark: DIR_ICON_PATH,
        }
      : {
          light: FILE_ICON_PATH,
          dark: FILE_ICON_PATH,
        };
  }
}
