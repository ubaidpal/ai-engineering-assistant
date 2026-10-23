import OpenAI from "openai";
import type { EmbeddingProvider } from "./embedding-provider.js";

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model = "text-embedding-3-small",
    baseURL?: string
  ) {
    this.client = new OpenAI({
      apiKey,
      timeout: 60_000,
      maxRetries: 2,
      ...(baseURL ? { baseURL } : {})
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.some((text) => !text.trim())) {
      throw new Error("Embedding inputs must not be empty.");
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts
    });

    return [...response.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}
