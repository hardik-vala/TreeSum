<<<<<<< HEAD
import OpenAI from "openai";
import * as path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
=======
import * as path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import OpenAIClient from "./openaiClient";
>>>>>>> main

// Constant for the default number of retries
const DEFAULT_RETRY_COUNT = 3;
const MAX_FILE_TOKENS = 1000;

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
  ): Promise<string> {
    const uri = vscode.Uri.joinPath(parent, fileOrDirName);
    const dirName = path.basename(parent.fsPath);
    const topLevelFolderContents = vscode.workspace.fs.readDirectory(parent);
    const topLevelContentsNames = (await topLevelFolderContents).map(
      ([fileOrDirName, type]) => {
        return fileOrDirName;
      }
    );
    const content = topLevelContentsNames.join(", ");

    const systemMessage = `
    You are a helpful assistant designed to summarize files.
    You are skilled at creating 1-sentence summaries of a file based on
    its file name and the other file names of its siblings inside of a directory.
    `;

    let prompt = `
    I'm providing you with the file names contained inside of
    a directory named ${dirName}.
    The contents in this directory are as follows:

    ${content}`;
    if (await this.isFile(uri)) {
      const text = await this.readTextFile(uri);
      const tokenCount = this.countTokens(text);
      if (text && tokenCount < MAX_FILE_TOKENS) {
        prompt += `
    I will select one of the files from this directory and provide you with
    its name and content. Please provide a short, concise, one-sentence summary of this file
    for the purposes of displaying the summary next to the file name
    inside of a nav menu within a text editor like Visual Studio Code.\n
    Don't waste any space re-stating the filename in your summary; you can assume
    I already know it. Be as concise as possible, and use sentence fragments to
    conserve space.

    File name:
    ${fileOrDirName}

    File content:
    ${text}

    Please provide a one-sentence summary for the file.
    `;
      } else {
        prompt += `
      I will select one of the files from this directory and provide you with
      its name. Please provide a short, concise, one-sentence summary of this file
      for the purposes of displaying the summary next to the file name
      inside of a nav menu within a text editor like Visual Studio Code.\n
      Don't waste any space re-stating the name of the file in your summary; you can assume
      I already know it. Be as concise as possible, and use sentence fragments to
      conserve space.
  
      Please provide a one-sentence summary for the following file:
      ${fileOrDirName}
      `;
      }
    } else {
      prompt += `
    I will select one of the subdirectories from this directory and provide you with
    its name. Please provide a short, concise, one-sentence summary of this subdirectory
    for the purposes of displaying the summary next to the subdirectory name
    inside of a nav menu within a text editor like Visual Studio Code.\n
    Don't waste any space re-stating the name of the subdirectory in your summary; you can assume
    I already know it. Be as concise as possible, and use sentence fragments to
    conserve space.

    Please provide a one-sentence summary for the following subdirectory:
    ${fileOrDirName}
    `;
    }

    try {
      const response = await this.openaiClient.createChatCompletion(
        systemMessage,
        prompt
      );

      if (response) {
        return response;
      } else {
        return "No summary available";
      }
    } catch (error) {
      if (isRateLimitError(error) && retries > 0) {
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

    function isRateLimitError(error: any): boolean {
      return error.status === 429;
    }
  }

  protected randomizedWait() {
    const min = 1000;
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
    return vscode.workspace.fs.readFile(uri).then(content => {
      if (content.toString().trim().length > 0) {
        return content.toString();
      }
      
      return null;
    });
  }

  private countTokens(text: string | null): number {
    if (!text) {
      return 0;
    }
    let tokens = text.split(/\s+|\\n+/gm); 
    tokens = tokens.filter(t => t.length > 0);
    return tokens.length;
  }
}

export default LLMService;
