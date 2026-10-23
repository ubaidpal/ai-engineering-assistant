import { describe, expect, it, vi } from "vitest";
import { ArchitectureService } from "../architecture-service.js";
import { buildServer } from "../server.js";
import type { RAGAIProvider } from "./rag-ai-provider.js";
import { RAGAnswerService } from "./rag-answer-service.js";
import { RAGService } from "./rag-service.js";

const knowledgeBase = new RAGService([
  {
    id: "modular-monolith",
    source: "modular-monolith.md",
    content:
      "A modular monolith simplifies deployment and maintains clear module boundaries."
  }
]);

const architectureProvider: RAGAIProvider = {
  answerWithContext: vi.fn().mockResolvedValue("Architecture answer")
};

const mockArchitectureService = new ArchitectureService(
  architectureProvider,
  knowledgeBase
);

describe("RAG HTTP endpoint", () => {
  it("returns an answer with source references", async () => {
    const ragProvider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "A modular monolith simplifies deployment."
      )
    };

    const app = buildServer({
      service: new ArchitectureService(ragProvider, knowledgeBase),
      ragAnswerService: new RAGAnswerService(knowledgeBase, ragProvider),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/rag/answer",
        payload: {
          question: "Why use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        answer: "A modular monolith simplifies deployment.",
        sources: ["modular-monolith.md"],
        requestId: expect.any(String)
      });
      expect(ragProvider.answerWithContext).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it("rejects an empty question", async () => {
    const ragProvider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected")
    };

    const app = buildServer({
      service: new ArchitectureService(ragProvider, knowledgeBase),
      ragAnswerService: new RAGAnswerService(knowledgeBase, ragProvider),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/rag/answer",
        payload: { question: "   " }
      });

      expect(response.statusCode).toBe(400);
      expect(ragProvider.answerWithContext).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("answers questions through the semantic RAG endpoint", async () => {
    const semanticRagAnswerService = {
      answer: vi.fn().mockResolvedValue({
        answer: "A modular monolith simplifies deployment.",
        sources: ["modular-monolith.md"]
      })
    } as unknown as RAGAnswerService;

    const server = buildServer({
      service: mockArchitectureService,
      semanticRagAnswerService,
      logger: false
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/api/rag/semantic/answer",
        payload: {
          question: "When should I use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body.answer).toBe(
        "A modular monolith simplifies deployment."
      );
      expect(body.sources).toEqual(["modular-monolith.md"]);
      expect(body.requestId).toEqual(expect.any(String));
      expect(body.requestId).not.toBe("");

      expect(semanticRagAnswerService.answer).toHaveBeenCalledWith(
        "When should I use a modular monolith?",
        body.requestId
      );
    } finally {
      await server.close();
    }
  });

  it("rejects a semantic RAG request without a question", async () => {
    const server = buildServer({
      service: mockArchitectureService,
      semanticRagAnswerService: {
        answer: vi.fn()
      } as unknown as RAGAnswerService,
      logger: false
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/api/rag/semantic/answer",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    } finally {
      await server.close();
    }
  });

  it("returns 502 when semantic RAG processing fails", async () => {
    const semanticRagAnswerService = {
      answer: vi.fn().mockRejectedValue(
        new Error("Embedding service unavailable")
      )
    } as unknown as RAGAnswerService;

    const server = buildServer({
      service: mockArchitectureService,
      semanticRagAnswerService,
      logger: false
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/api/rag/semantic/answer",
        payload: {
          question: "When should I use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        error: "Semantic RAG request failed."
      });
    } finally {
      await server.close();
    }
  });
});
