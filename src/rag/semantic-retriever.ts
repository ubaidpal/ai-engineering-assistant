
import type { EmbeddingProvider } from "./embedding-provider.js";
import { cosineSimilarity } from "./cosine-similarity.js";
import { diversifyResults } from "./diversify-results.js";
import type { DocumentChunk, RetrievedChunk } from "./types.js";

type IndexedChunk = {
  chunk: DocumentChunk;
  embedding: number[];
};

export class SemanticRetriever {
  private readonly index: IndexedChunk[];

  private constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    index: IndexedChunk[]
  ) {
    this.index = index;
  }

  static async create(
    chunks: DocumentChunk[],
    embeddingProvider: EmbeddingProvider
  ): Promise<SemanticRetriever> {
    const embeddings = await embeddingProvider.embed(
      chunks.map((chunk) => chunk.content)
    );

    if (embeddings.length !== chunks.length) {
      throw new Error("Embedding count must match chunk count.");
    }

    if (
      embeddings.some(
        (embedding) =>
          embedding.length === 0 ||
          embedding.some((value) => !Number.isFinite(value))
      )
    ) {
      throw new Error("Embeddings must contain finite, non-empty vectors.");
    }

    const dimensions = embeddings[0]?.length;

    if (
      dimensions !== undefined &&
      embeddings.some((embedding) => embedding.length !== dimensions)
    ) {
      throw new Error("All embeddings must have the same dimensions.");
    }

    return new SemanticRetriever(
      embeddingProvider,
      chunks.map((chunk, index) => ({
        chunk,
        embedding: embeddings[index]
      }))
    );
  }

  async retrieve(
    question: string,
    limit = 3,
    minScore = -1,
    maxPerSource?: number
  ): Promise<RetrievedChunk[]> {
    if (!question.trim() || limit <= 0 || this.index.length === 0) {
      return [];
    }

    if (!Number.isFinite(minScore) || minScore < -1 || minScore > 1) {
      throw new Error("minScore must be between -1 and 1.");
    }

    if (
      maxPerSource !== undefined &&
      (!Number.isInteger(maxPerSource) || maxPerSource <= 0)
    ) {
      throw new Error("maxPerSource must be a positive integer.");
    }

    const [questionEmbedding] = await this.embeddingProvider.embed([
      question
    ]);

    if (!questionEmbedding?.length) {
      throw new Error("Question embedding is empty.");
    }

    const ranked = this.index
      .map(({ chunk, embedding }) => ({
        ...chunk,
        score: cosineSimilarity(questionEmbedding, embedding)
      }))
      .filter((chunk) => chunk.score >= minScore)
      .sort((a, b) => b.score - a.score);

    if (maxPerSource === undefined) {
      return ranked.slice(0, limit);
    }

    return diversifyResults(ranked, limit, maxPerSource);
  }
}
