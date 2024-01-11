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
      const response = await this.openai.chat.completions.create({
        messages: [{role: "system", content: `Summarize the following content in one or two sentences:\n\n${content}`}],
        model: "gpt-4", // Replace with the model of your choice
        // prompt: `Summarize the following content in one or two sentences:\n\n${content}`,
        max_tokens: 100, // Adjust as needed
      });

      // return response.choices[0].text.trim();
      if (response.choices[0].message.content !== null) {
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
