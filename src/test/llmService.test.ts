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
    protected wait() {
      return Promise.resolve();
    }

    protected randomizedWait() {
      return Promise.resolve();
    }
  }

  setup(() => {
    openaiClientStub = sinon.createStubInstance(OpenAIClient);
    openaiClientStub.getModelKey.returns("gpt-3.5-turbo-0125");
    llmService = new TestLLMService(openaiClientStub);
  });

  teardown(() => {
    sinon.restore();
  });

  test("summarizeFileOrDirectory with file", async () => {
    openaiClientStub.createChatCompletion.resolves("FAKE SUMMARY");

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_file_1.txt"
    );

    assert.strictEqual(summary, "FAKE SUMMARY");

    const expectedSystemMessage = `You are a helpful assistant designed to summarize files and subdirectories. You are skilled at creating 1-sentence summaries of a file or subdirectory based on its name and its siblings inside of the parent directory.`;

    const expectedPrompt = `
    I'm providing you with the file names contained inside of a directory named test_workspace:

    test_file_1.txt, test_subdir

    For the purposes of displaying a summary next to the file in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this file:

    test_file_1.txt

    This is the contents of the file:

    This is a test.

    Don't waste any space re-stating the name of the file in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.

    Please provide a one-sentence summary for this file: test_file_1.txt
    `;
    assert.strictEqual(
      openaiClientStub.createChatCompletion.calledOnceWith(
        expectedSystemMessage,
        expectedPrompt
      ),
      true
    );
  });

  test("summarizeFileOrDirectory with subdirectory", async () => {
    openaiClientStub.createChatCompletion.resolves("FAKE SUMMARY");

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_subdir"
    );

    assert.strictEqual(summary, "FAKE SUMMARY");

    const expectedSystemMessage = `You are a helpful assistant designed to summarize files and subdirectories. You are skilled at creating 1-sentence summaries of a file or subdirectory based on its name and its siblings inside of the parent directory.`;

    const expectedPrompt = `
    I'm providing you with the file names contained inside of a directory named test_workspace:

    test_file_1.txt, test_subdir

    For the purposes of displaying a summary next to the subdirectory in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this subdirectory:

    test_subdir

    This is the contents of the subdirectory:

    test_file_2.txt, test_file_3.txt

    Don't waste any space re-stating the name of the subdirectory in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.

    Please provide a one-sentence summary for this subdirectory: test_subdir
    `;
    assert.strictEqual(
      openaiClientStub.createChatCompletion.calledOnceWith(
        expectedSystemMessage,
        expectedPrompt
      ),
      true
    );
  });

  test("summarizeFileOrDirectory with empty OpenAI completion", async () => {
    openaiClientStub.createChatCompletion.resolves(undefined);

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_file_1.txt"
    );

    assert.strictEqual(summary, null);
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

  test("summarizeFileOrDirectory when file exceeds max token count", async () => {
    class LocalTestLLMService extends TestLLMService {
      protected getMaxTokenCount() {
        return 3;
      }
    }
    llmService = new LocalTestLLMService(openaiClientStub);

    openaiClientStub.createChatCompletion.resolves("FAKE SUMMARY");

    const summary = await llmService.summarizeFileOrDirectory(
      getWorkspaceRootUri(),
      "test_file_1.txt"
    );

    assert.strictEqual(summary, "FAKE SUMMARY");

    const expectedSystemMessage = `You are a helpful assistant designed to summarize files and subdirectories. You are skilled at creating 1-sentence summaries of a file or subdirectory based on its name and its siblings inside of the parent directory.`;

    const expectedPrompt = `
    I'm providing you with the file names contained inside of a directory named test_workspace:

    test_file_1.txt, test_subdir

    For the purposes of displaying a summary next to the file in a file explorer inside Visual Studio Code, please provide a short, concise, one-sentence summary of this file:

    test_file_1.txt

    Don't waste any space re-stating the name of the file in your summary.
    Be as concise as possible, and use sentence fragments to conserve space.
    `;
    assert.strictEqual(
      openaiClientStub.createChatCompletion.calledOnceWith(
        expectedSystemMessage,
        expectedPrompt
      ),
      true
    );
  });
});

function getWorkspaceRootUri(): vscode.Uri {
  const path = getWorkspaceRootPath();
  if (!path) {
    throw new Error("No workspace folders found");
  }

  return vscode.Uri.file(path);
}
