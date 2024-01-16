import OpenAI from 'openai';
import * as vscode from "vscode";
import { Uri } from 'vscode';
import * as path from "path";

class LLMService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  async summarizeFileOrDirectory(parent: Uri, fileOrDirName: string): Promise<string> {
    const dirName = path.basename(parent.fsPath);
    const topLevelFolderContents = vscode.workspace.fs.readDirectory(parent);
    const topLevelContentsNames = (await topLevelFolderContents).map(([fileOrDirName, type]) => {
      return fileOrDirName;
    });
    const content = topLevelContentsNames.join(', ');

    const systemMessage = `
    You are a helpful assistant designed to summarize files.
    You are skilled at creating 1-sentence summaries of a file based on
    its file name and the other file names of its siblings inside of a directory.
    `;

    const prompt = `
    I'm providing you with the file names contained inside of
    a directory named ${dirName}.
    The contents in this directory are as follows: \n

    ${content}\n

    I will select one of the files from this directory and provide you with
    its name. Please provide a short, concise, one-sentence summary of this file
    for the purposes of displaying the summary next to the file name
    inside of a nav menu within a text editor like Visual Studio Code.\n
    Don't waste any space re-stating the filename in your summary; you can assume
    I already know it. Be as cocise as possible, and use sentence fragments to
    conservce space.

    Please provide a one-sentence summary for the following file or directory:
    ${fileOrDirName}
    `; 

    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          {role: "system", content: systemMessage},
          {role: "user", content: prompt}
        ],
        model: "gpt-4",
      });

      if (response.choices[0].message.content !== null) {
        console.log(response.choices[0].message.content?.trim());
        return response.choices[0].message.content?.trim();
      } else {
        return 'No summary available';
      }
    } catch (error) {
      console.error("Error in LLMService:", error);
      throw error;
    }
  }

}

export default LLMService;
