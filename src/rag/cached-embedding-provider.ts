import type { EmbeddingProvider } from "./embedding-provider.js";

export class CachedEmbeddingProvider implements EmbeddingProvider {
  private readonly cache = new Map<string, number[]>();

  constructor(private readonly provider: EmbeddingProvider) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.some((text) => !text.trim())) {
      throw new Error("Embedding inputs must not be empty.");
    }

    const uniqueMissing = [
      ...new Set(texts.filter((text) => !this.cache.has(text)))
    ];

    if (uniqueMissing.length > 0) {
      const embeddings = await this.provider.embed(uniqueMissing);

      if (embeddings.length !== uniqueMissing.length) {
        throw new Error("Embedding count must match input count.");
      }

      for (let i = 0; i < uniqueMissing.length; i++) {
        const embedding = embeddings[i];

        if (
          !embedding ||
          embedding.length === 0 ||
          embedding.some((value) => !Number.isFinite(value))
        ) {
          throw new Error(
            "Embeddings must contain finite, non-empty vectors."
          );
        }

        this.cache.set(uniqueMissing[i], embedding);
      }
    }

    return texts.map((text) => {
      const embedding = this.cache.get(text);

      if (!embedding) {
        throw new Error("Embedding cache entry is missing.");
      }

      return [...embedding];
    });
  }
}
