import OpenAI from 'openai';


class LLMService {
  private openai: OpenAI;

  // TODO: test call to OpenAI with some file/directory contents
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  async summarizeContent(content: string): Promise<string> {
    try {
      const response = await this.openai.completions.create({
        model: "gpt-3.5-turbo", // Replace with the model of your choice
        prompt: `Summarize the following content in one or two sentences:\n\n${content}`,
        max_tokens: 100, // Adjust as needed
      });

      return response.choices[0].text.trim();
    } catch (error) {
      console.error("Error in LLMService:", error);
      throw error;
    }
  }
}

export default LLMService;
