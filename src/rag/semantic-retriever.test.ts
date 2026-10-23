
import { describe, expect, it, vi } from "vitest";
import type { EmbeddingProvider } from "./embedding-provider.js";
import { SemanticRetriever } from "./semantic-retriever.js";
import type { DocumentChunk } from "./types.js";

const chunks: DocumentChunk[] = [
  {
    id: "mono-1",
    documentId: "mono",
    source: "modular-monolith.md",
    content: "A modular monolith simplifies deployment."
  },
  {
    id: "micro-1",
    documentId: "micro",
    source: "microservices.md",
    content: "Microservices support independent scaling."
  }
];

describe("SemanticRetriever", () => {
  it("ranks chunks by cosine similarity", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn()
        .mockResolvedValueOnce([
          [1, 0],
          [0, 1]
        ])
        .mockResolvedValueOnce([[0.9, 0.1]])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);
    const results = await retriever.retrieve("How can deployment be simpler?");

    expect(results[0].source).toBe("modular-monolith.md");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("returns no results for an empty question", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([[1, 0], [0, 1]])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(retriever.retrieve("  ")).resolves.toEqual([]);
    expect(provider.embed).toHaveBeenCalledOnce();
  });

  it("rejects mismatched embedding dimensions", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([[1, 0], [1, 0, 1]])
    };

    await expect(
      SemanticRetriever.create(chunks, provider)
    ).rejects.toThrow("All embeddings must have the same dimensions.");
  });

  it("returns no results when the limit is zero or negative", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [1, 0],
        [0, 1]
      ])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(retriever.retrieve("deployment", 0)).resolves.toEqual([]);
    await expect(retriever.retrieve("deployment", -1)).resolves.toEqual([]);

    // Only the document embeddings should have been generated.
    expect(provider.embed).toHaveBeenCalledOnce();
  });

  it("rejects zero-vector embeddings", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [0, 0],
        [1, 0]
      ])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(retriever.retrieve("deployment")).rejects.toThrow(
      "Vectors must not be zero vectors."
    );
  });

  it("rejects question embeddings with incompatible dimensions", async () => {
    const provider: EmbeddingProvider = {
      embed: vi
        .fn()
        .mockResolvedValueOnce([
          [1, 0],
          [0, 1]
        ])
        .mockResolvedValueOnce([[1, 0, 1]])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(retriever.retrieve("deployment")).rejects.toThrow(
      "Vectors must have the same non-zero dimension."
    );
  });

  it("filters out chunks below the minimum similarity score", async () => {
    const provider: EmbeddingProvider = {
      embed: vi
        .fn()
        .mockResolvedValueOnce([
          [1, 0],
          [0, 1]
        ])
        .mockResolvedValueOnce([[0.9, 0.1]])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    const results = await retriever.retrieve("deployment", 3, 0.8);

    expect(results).toHaveLength(1);
    expect(results[0].source).toBe("modular-monolith.md");
  });

  it("rejects invalid minimum similarity scores", async () => {
    const provider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [1, 0],
        [0, 1]
      ])
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(retriever.retrieve("deployment", 3, 1.5)).rejects.toThrow(
      "minScore must be between -1 and 1."
    );

    expect(provider.embed).toHaveBeenCalledOnce();
  });

  it("propagates embedding provider failures", async () => {
    const provider: EmbeddingProvider = {
      embed: vi
        .fn()
        .mockResolvedValueOnce([
          [1, 0],
          [0, 1]
        ])
        .mockRejectedValueOnce(new Error("Embedding service unavailable"))
    };

    const retriever = await SemanticRetriever.create(chunks, provider);

    await expect(
      retriever.retrieve("When should I use a modular monolith?")
    ).rejects.toThrow("Embedding service unavailable");
  });
});
