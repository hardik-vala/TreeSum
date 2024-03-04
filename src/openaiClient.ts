import OpenAI from "openai";

class OpenAIClient {
  private openai: OpenAI;
  private modelKey: string;

  constructor(apiKey: string, modelKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.modelKey = modelKey;
  }

  public async createChatCompletion(
    systemPrompt: string,
    prompt: string
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: this.modelKey
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

  public getModelKey(): string {
    return this.modelKey;
  }
}

export default OpenAIClient;
