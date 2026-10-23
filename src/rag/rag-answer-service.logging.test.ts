import { describe, expect, it, vi } from "vitest";
import type { ChunkRetriever } from "./chunk-retriever.js";
import type { RAGAIProvider } from "./rag-ai-provider.js";
import { RAGAnswerService } from "./rag-answer-service.js";
import type { RAGLogEvent, RAGLogger } from "./rag-logger.js";
import type { RetrievedChunk } from "./types.js";

function makeChunk(source: string): RetrievedChunk {
  return {
    id: `${source}-chunk-1`,
    documentId: source,
    source,
    content: "Example evidence",
    score: 0.9
  };
}

function makeLogger() {
  const events: RAGLogEvent[] = [];

  const logger: RAGLogger = {
    log: vi.fn((event) => events.push(event))
  };

  return { logger, events };
}

describe("RAGAnswerService logging", () => {
  it("logs successful answers with sources and retrieved chunk count", async () => {
    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue([
        makeChunk("microservices.md"),
        makeChunk("modular-monolith.md")
      ])
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi
        .fn()
        .mockResolvedValue("Use the right architecture.")
    };

    const { logger, events } = makeLogger();
    const service = new RAGAnswerService(retriever, aiProvider, {}, logger);

    const result = await service.answer("Which architecture should I use?");

    expect(result.sources).toEqual([
      "microservices.md",
      "modular-monolith.md"
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event: "answer",
      retrievedChunks: 2,
      sources: ["microservices.md", "modular-monolith.md"],
      outcome: "success"
    });
    expect(events[0].durationMs).toEqual(expect.any(Number));
  });

  it("logs empty retrieval without calling the AI provider", async () => {
    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue([])
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi.fn()
    };

    const { logger, events } = makeLogger();
    const service = new RAGAnswerService(retriever, aiProvider, {}, logger);

    const result = await service.answer("Unknown topic");

    expect(result.sources).toEqual([]);
    expect(aiProvider.answerWithContext).not.toHaveBeenCalled();
    expect(events[0]).toMatchObject({
      retrievedChunks: 0,
      sources: [],
      outcome: "empty"
    });
  });

  it("logs provider failures and rethrows the error", async () => {
    const retriever: ChunkRetriever = {
      retrieve: vi.fn().mockResolvedValue([makeChunk("microservices.md")])
    };

    const aiProvider: RAGAIProvider = {
      answerWithContext: vi
        .fn()
        .mockRejectedValue(new Error("Provider unavailable"))
    };

    const { logger, events } = makeLogger();
    const service = new RAGAnswerService(retriever, aiProvider, {}, logger);

    await expect(service.answer("Explain microservices")).rejects.toThrow(
      "Provider unavailable"
    );

    expect(events[0]).toMatchObject({
      event: "answer",
      outcome: "error"
    });
    expect(events[0].durationMs).toEqual(expect.any(Number));
  });
});
