import * as path from "path";
import { encoding_for_model, TiktokenModel } from "tiktoken";
import * as vscode from "vscode";
import { Uri } from "vscode";
import OpenAIClient from "./openaiClient";

// Constant for the default number of retries
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_MAX_TOKEN_COUNT = 8000;
const MAX_FILE_TOKEN_COUNT_DICT: { [key: string]: number } = {
  "gpt-3.5-turbo-0125": 16000,
  "gpt-4-32k-0613": 32000,
};
const DEFAULT_WAIT_MILLIS = 1000;
const SYSTEM_MESSAGE = `You are a helpful assistant designed to summarize files and subdirectories. You are skilled at creating 1-sentence summaries of a file or subdirectory based on its name and its siblings inside of the parent directory.`;

class LLMService {
  private openaiClient: OpenAIClient;

  constructor(openaiClient: OpenAIClient) {
    this.openaiClient = openaiClient;
  }

  /**
   * Generates a concise summary for a specified file or directory within a given parent directory.
   *
   * This method leverages OpenAI's GPT model to create a one-sentence summary, which is intended
   * for display in a navigation menu within a text editor like Visual Studio Code. The summary
   * is generated based on the file or directory's name and the names of its sibling files and
   * directories, providing contextual understanding of its contents or purpose.
   *
   * The method first retrieves the names of all items in the specified parent directory. It then
   * constructs a prompt for the GPT model, including the names of these items and the specific
   * file or directory to be summarized. The resulting summary is concise, avoiding repetition of
   * the file or directory's name, and aims to use sentence fragments where appropriate to conserve
   * space in the UI.
   *
   * @param parent - A `vscode.Uri` object representing the parent directory of the file or directory to summarize.
   * @param fileOrDirName - The name of the file or directory for which the summary is to be generated.
   * @returns A promise that resolves to the generated summary string. If the summary cannot be generated,
   *          a default message indicating no summary is available will be returned.
   */
  async summarizeFileOrDirectory(
    parent: Uri,
    fileOrDirName: string,
    retries: number = DEFAULT_RETRY_COUNT
  ): Promise<string | null> {
    const uri = vscode.Uri.joinPath(parent, fileOrDirName);
    const dirName = path.basename(parent.fsPath);
    const topLevelContentsNames: string[] = await this.getDirectoryContentNames(parent);

    let prompt = "";
    if (await this.isFile(uri)) {
      const fileContent = await this.readTextFile(uri);

      if (!fileContent) {
        prompt = this.constructPromptForFile(
          dirName,
          topLevelContentsNames,
          fileOrDirName
        );
      } else {
        prompt = this.constructPromptWithFileContent(
          dirName,
          topLevelContentsNames,
          fileOrDirName,
          fileContent
        );
        const tokenCount = this.countTokens(prompt);
        if (tokenCount > this.getMaxTokenCount()) {
          prompt = this.constructPromptForFile(
            dirName,
            topLevelContentsNames,
            fileOrDirName
          );
        }
      }
    } else {
      const subdirContentNames = await this.getDirectoryContentNames(uri);
      prompt = this.constructPromptForSubdir(
        dirName,
        topLevelContentsNames,
        fileOrDirName,
        subdirContentNames
      );
    }

    try {
      const response = await this.openaiClient.createChatCompletion(
        SYSTEM_MESSAGE,
        prompt
      );

      await this.wait();

      if (response) {
        return response;
      } else {
        return null;
      }
    } catch (error) {
      if (this.isRateLimitError(error) && retries > 0) {
        console.error("Rate limit reached, retrying...", error);
        await this.randomizedWait();
        return this.summarizeFileOrDirectory(
          parent,
          fileOrDirName,
          retries - 1
        );
      } else {
        console.error("Error in LLMService:", error);
        throw error;
      }
    }
  }

  protected wait() {
    return new Promise((resolve) => setTimeout(resolve, DEFAULT_WAIT_MILLIS));
  }

  protected randomizedWait() {
    const min = DEFAULT_WAIT_MILLIS;
    const max = 4000;

    const delay = Math.random() * (max - min) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async isFile(uri: vscode.Uri): Promise<boolean> {
    return vscode.workspace.fs.stat(uri).then((stats) => {
      if (stats.type === vscode.FileType.File) {
        return true;
      }
      if (stats.type === vscode.FileType.Directory) {
        return false;
      }

      throw new Error("Unknown file type.");
    });
  }

  private async readTextFile(uri: vscode.Uri): Promise<string | null> {
    return vscode.workspace.fs.readFile(uri).then((content) => {
      if (content.toString().trim().length > 0) {
        return content.toString();
      }

      return null;
    });
  }

  private async getDirectoryContentNames(uri: vscode.Uri): Promise<string[]> {
    const contents = vscode.workspace.fs.readDirectory(uri);
    const contentNames: string[] = (await contents).map(
      ([fileOrDirName, type]) => {
        return fileOrDirName;
      }
    );
    return contentNames;
  }

  private constructPromptForFile(
    dirName: string,
    topLevelContentsNames: string[],
    fileName: string
  ): string {
    const content = topLevelContentsNames.join(", ");

    let prompt = `
    I'm providing you with the file names contained inside of a directory named ${dirName}:

    ${content}

    For the purposes of displaying a summary next to the file in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this file:

    ${fileName}

    Don't waste any space re-stating the name of the file in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.
    `;

    return prompt;
  }

  private constructPromptForSubdir(
    dirName: string,
    topLevelContentsNames: string[],
    subdirName: string,
    subdirContentNames: string[],
  ): string {
    const content = topLevelContentsNames.join(", ");

    let prompt = `
    I'm providing you with the file names contained inside of a directory named ${dirName}:

    ${content}

    For the purposes of displaying a summary next to the subdirectory in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this subdirectory:

    ${subdirName}

    This is the contents of the subdirectory:

    ${subdirContentNames.join(", ")}

    Don't waste any space re-stating the name of the subdirectory in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.

    Please provide a one-sentence summary for this subdirectory: ${subdirName}
    `;

    return prompt;
  }

  private constructPromptWithFileContent(
    dirName: string,
    topLevelContentsNames: string[],
    fileName: string,
    fileContent: string
  ): string {
    let prompt = `
    I'm providing you with the file names contained inside of a directory named ${dirName}:

    ${topLevelContentsNames.join(", ")}

    For the purposes of displaying a summary next to the file in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this file:

    ${fileName}

    This is the contents of the file:

    ${fileContent}

    Don't waste any space re-stating the name of the file in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.

    Please provide a one-sentence summary for this file: ${fileName}
    `;

    return prompt;
  }

  private countTokens(text: string): number {
    const modelKey = this.openaiClient.getModelKey();
    const encoder = encoding_for_model(modelKey as TiktokenModel);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  }

  protected getMaxTokenCount(): number {
    const modelKey = this.openaiClient.getModelKey();
    return modelKey in MAX_FILE_TOKEN_COUNT_DICT
      ? MAX_FILE_TOKEN_COUNT_DICT[modelKey]
      : DEFAULT_MAX_TOKEN_COUNT;
  }

  private isRateLimitError(error: any): boolean {
    return error.status === 429;
  }
}

export default LLMService;
