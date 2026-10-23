
import { describe, expect, it, vi } from "vitest";
import type { ChunkRetriever } from "./chunk-retriever.js";
import type { EmbeddingProvider } from "./embedding-provider.js";
import { RAGAnswerService } from "./rag-answer-service.js";
import type { RAGAIProvider } from "./rag-ai-provider.js";
import { RAGService } from "./rag-service.js";
import { SemanticRetriever } from "./semantic-retriever.js";

describe("RAGAnswerService", () => {
  const knowledgeBase = new RAGService([
    {
      id: "modular-monolith",
      source: "modular-monolith.md",
      content:
        "A modular monolith simplifies deployment and maintains clear business module boundaries."
    },
    {
      id: "microservices",
      source: "microservices.md",
      content:
        "Microservices support independent deployment and scaling but introduce distributed systems complexity."
    }
  ]);

  it("generates an answer and returns source references", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "A modular monolith simplifies deployment. [Source: modular-monolith.md]"
      )
    };

    const service = new RAGAnswerService(knowledgeBase, provider);
    const result = await service.answer(
      "Why does a modular monolith simplify deployment?"
    );

    expect(result.answer).toContain("simplifies deployment");
    expect(result.sources).toContain("modular-monolith.md");
    expect(provider.answerWithContext).toHaveBeenCalledOnce();
  });

  it("does not call AI when no evidence is found", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected")
    };

    const service = new RAGAnswerService(knowledgeBase, provider);
    const result = await service.answer("quantum astronomy");

    expect(result.sources).toEqual([]);
    expect(result.answer).toContain(
      "couldn't find sufficiently relevant information"
    );
    expect(provider.answerWithContext).not.toHaveBeenCalled();
  });

  it("rejects an empty provider response", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("   ")
    };

    const service = new RAGAnswerService(knowledgeBase, provider);

    await expect(
      service.answer("Why does a modular monolith simplify deployment?")
    ).rejects.toThrow("The AI provider returned no answer.");
  });

  it("returns insufficient evidence when semantic scores are below minScore", async () => {
    const embeddingProvider: EmbeddingProvider = {
      embed: vi
        .fn()
        .mockResolvedValueOnce([
          [1, 0],
          [0, 1]
        ])
        .mockResolvedValueOnce([[0.5, 0.5]])
    };

    const retriever = await SemanticRetriever.create(
      [
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
      ],
      embeddingProvider
    );

    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected")
    };

    const service = new RAGAnswerService(retriever, provider, {
      minScore: 0.8
    });

    const result = await service.answer(
      "What is the capital of France?"
    );

    expect(result.sources).toEqual([]);
    expect(result.answer).toContain(
      "couldn't find sufficiently relevant information"
    );
    expect(provider.answerWithContext).not.toHaveBeenCalled();
  });
});

describe("RAGAnswerService evidence handling", () => {
  it("does not call the AI provider when retrieval returns no evidence", async () => {
    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue([])
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi.fn()
    };

    const service = new RAGAnswerService(retriever, aiProvider, {
      minScore: 0.8
    });

    const result = await service.answer("What is the capital of Mars?");

    expect(result).toEqual({
      answer:
        "I couldn't find sufficiently relevant information in the available knowledge base.",
      sources: []
    });

    expect(aiProvider.answerWithContext).not.toHaveBeenCalled();
    expect(retriever.retrieve).toHaveBeenCalledWith(
      "What is the capital of Mars?",
      3,
      0.8,
      undefined
    );
  });

  it("uses the default configuration when no threshold is provided", async () => {
    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue([])
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi.fn()
    };

    const service = new RAGAnswerService(retriever, aiProvider);

    await service.answer("An unrelated question");

    expect(retriever.retrieve).toHaveBeenCalledWith(
      "An unrelated question",
      3,
      undefined,
      undefined
    );

    expect(aiProvider.answerWithContext).not.toHaveBeenCalled();
  });

  it("passes retrieval options to the retriever", async () => {
    const evidence = [
      {
        id: "mono-1",
        documentId: "mono",
        source: "modular-monolith.md",
        content: "A modular monolith simplifies deployment.",
        score: 0.92
      }
    ];

    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue(evidence)
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "A modular monolith simplifies deployment."
      )
    };

    const service = new RAGAnswerService(retriever, aiProvider, {
      minScore: 0.8,
      maxPerSource: 1
    });

    await service.answer("When should I use a modular monolith?");

    expect(retriever.retrieve).toHaveBeenCalledWith(
      "When should I use a modular monolith?",
      3,
      0.8,
      1
    );
  });
});
