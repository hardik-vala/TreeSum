import OpenAI from "openai";

class OpenAIClient {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async createChatCompletion(
    systemPrompt: string,
    prompt: string
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: "gpt-3.5-turbo-0125"
      });

      if (
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message.content
      ) {
        return response.choices[0].message.content.trim();
      } else {
        return "";
      }
    } catch (error) {
      console.error("Error in OpenAIClient:", error);
      throw error;
    }
  }
}

export default OpenAIClient;
