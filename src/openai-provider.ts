import OpenAI from "openai";
import type { AIProvider } from "./ai-provider.js";

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(
    private readonly model: string,
    apiKey: string,
    baseURL?: string
  ) {
    this.client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {})
    });
  }

  async answer(question: string): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      max_output_tokens: 4000,
      reasoning: { effort: "minimal" },
      instructions:
        "You are a senior software architecture assistant. " +
        "Explain assumptions and important trade-offs.",
      input: question
    });

    return response.output_text ?? "";
  }
}
