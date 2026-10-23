import { describe, expect, it, vi } from "vitest";
import { ArchitectureService } from "./architecture-service.js";
import type { RAGAIProvider } from "./rag/rag-ai-provider.js";
import { RAGAnswerService } from "./rag/rag-answer-service.js";
import { RAGService } from "./rag/rag-service.js";
import { buildServer } from "./server.js";

const knowledgeBase = new RAGService([
  {
    id: "modular-monolith",
    source: "modular-monolith.md",
    content:
      "Start with a modular monolith when simplicity matters."
  }
]);

describe("Architecture API", () => {
  it("returns an AI answer for a valid request", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "Start with a modular monolith when simplicity matters."
      )
    };

    const app = buildServer({
      service: new ArchitectureService(provider, knowledgeBase),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/architecture/answer",
        payload: {
          question: "When should I use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        answer:
          "Start with a modular monolith when simplicity matters."
      });
      expect(provider.answerWithContext).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it("rejects an empty question", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected")
    };

    const app = buildServer({
      service: new ArchitectureService(provider, knowledgeBase),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/architecture/answer",
        payload: { question: "" }
      });

      expect(response.statusCode).toBe(400);
      expect(provider.answerWithContext).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});

describe("RAG API", () => {
  it("returns an answer with sources", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue(
        "Start with a modular monolith when simplicity matters."
      )
    };

    const app = buildServer({
      service: new ArchitectureService(provider, knowledgeBase),
      ragAnswerService: new RAGAnswerService(knowledgeBase, provider),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/rag/answer",
        payload: {
          question: "When should I use a modular monolith?"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        answer:
          "Start with a modular monolith when simplicity matters.",
        sources: ["modular-monolith.md"]
      });
      expect(provider.answerWithContext).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it("rejects a whitespace-only question", async () => {
    const provider: RAGAIProvider = {
      answerWithContext: vi.fn().mockResolvedValue("Unexpected")
    };

    const app = buildServer({
      service: new ArchitectureService(provider, knowledgeBase),
      ragAnswerService: new RAGAnswerService(knowledgeBase, provider),
      logger: false
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/rag/answer",
        payload: { question: "   " }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: "INVALID_QUESTION",
        message: "Question must not be empty."
      });
      expect(provider.answerWithContext).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
