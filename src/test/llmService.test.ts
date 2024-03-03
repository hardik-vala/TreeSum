import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import LLMService from "../llmService";
import OpenAIClient from "../openaiClient";
import { getWorkspaceRootPath } from "../workspace";

suite("LLMService Test Suite", () => {
  let openaiClientStub: sinon.SinonStubbedInstance<OpenAIClient>;
  let llmService: LLMService;

  class TestLLMService extends LLMService {
    protected randomizedWait() {
      return Promise.resolve();
    }
  }

  setup(() => {
    openaiClientStub = sinon.createStubInstance(OpenAIClient);
    llmService = new TestLLMService(openaiClientStub);
  });

  teardown(() => {
    sinon.restore();
  });

  test("summarizeFileOrDirectory", async () => {
    openaiClientStub.createChatCompletion.resolves("FAKE SUMMARY");

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_file_1.txt"
    );

    assert.strictEqual(summary, "FAKE SUMMARY");

    const expectedSystemMessage = `
    You are a helpful assistant designed to summarize files.
    You are skilled at creating 1-sentence summaries of a file based on
    its file name and the other file names of its siblings inside of a directory.
    `;
    const expectedPrompt = `
    I'm providing you with the file names contained inside of
    a directory named test_workspace.
    The contents in this directory are as follows: 


    test_file_1.txt, test_subdir


    I will select one of the files from this directory and provide you with
    its name. Please provide a short, concise, one-sentence summary of this file
    for the purposes of displaying the summary next to the file name
    inside of a nav menu within a text editor like Visual Studio Code.

    Don't waste any space re-stating the filename in your summary; you can assume
    I already know it. Be as concise as possible, and use sentence fragments to
    conserve space.

    Please provide a one-sentence summary for the following file or directory:
    test_file_1.txt
    `;
    assert.strictEqual(
      openaiClientStub.createChatCompletion.calledOnceWith(
        expectedSystemMessage,
        expectedPrompt
      ),
      true
    );
  });

  test("summarizeFileOrDirectory with retry on rate limit error", async () => {
    const rateLimitError: any = new Error("Rate limit exceeded");
    rateLimitError["status"] = 429;
    openaiClientStub.createChatCompletion.onFirstCall().rejects(rateLimitError);
    openaiClientStub.createChatCompletion
      .onSecondCall()
      .resolves("FAKE SUMMARY");

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_file_1.txt"
    );

    assert.strictEqual(summary, "FAKE SUMMARY");
    assert.strictEqual(openaiClientStub.createChatCompletion.calledTwice, true);
  });

  test("summarizeFileOrDirectory with no retry on non-rate limit error", async () => {
    const someError = new Error("Some error");
    openaiClientStub.createChatCompletion.onFirstCall().rejects(someError);

    try {
      const summary = await llmService.summarizeFileOrDirectory(
        getWorkspaceRootUri(),
        "test_file_1.txt"
      );
    } catch (error) {
      assert.strictEqual(error, someError);
      assert.strictEqual(
        openaiClientStub.createChatCompletion.calledOnce,
        true
      );
    }
  });
});

function getWorkspaceRootUri(): vscode.Uri {
  const path = getWorkspaceRootPath();
  if (!path) {
    throw new Error("No workspace folders found");
  }

  return vscode.Uri.file(path);
}
