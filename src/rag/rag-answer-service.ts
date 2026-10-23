import { randomUUID } from "node:crypto";
import type { ChunkRetriever } from "./chunk-retriever.js";
import type { RAGAIProvider } from "./rag-ai-provider.js";
import {
  ConsoleRAGLogger,
  type RAGLogger
} from "./rag-logger.js";

export type RAGAnswer = {
  answer: string;
  sources: string[];
};

export type RAGAnswerOptions = {
  minScore?: number;
  maxPerSource?: number;
};

export class RAGAnswerService {
  constructor(
    private readonly retriever: ChunkRetriever,
    private readonly aiProvider: RAGAIProvider,
    private readonly options: RAGAnswerOptions = {},
    private readonly logger: RAGLogger = new ConsoleRAGLogger()
  ) {}

  async answer(
    question: string,
    requestId: string = randomUUID()
  ): Promise<RAGAnswer> {
    const startedAt = Date.now();
    let retrievalDurationMs: number | undefined;
    let generationDurationMs: number | undefined;

    try {
      const retrievalStartedAt = Date.now();

      const evidence = await this.retriever.retrieve(
        question,
        3,
        this.options.minScore,
        this.options.maxPerSource
      );

      retrievalDurationMs = Date.now() - retrievalStartedAt;

      if (evidence.length === 0) {
        this.logger.log({
          event: "answer",
          requestId,
          durationMs: Date.now() - startedAt,
          retrievalDurationMs,
          retrievedChunks: 0,
          sources: [],
          outcome: "empty"
        });

        return {
          answer:
            "I couldn't find sufficiently relevant information in the available knowledge base.",
          sources: []
        };
      }

      const generationStartedAt = Date.now();

      const answer = (
        await this.aiProvider.answerWithContext(question, evidence)
      ).trim();

      generationDurationMs = Date.now() - generationStartedAt;

      if (!answer) {
        throw new Error("The AI provider returned no answer.");
      }

      const sources = [...new Set(evidence.map((chunk) => chunk.source))];

      this.logger.log({
        event: "answer",
        requestId,
        durationMs: Date.now() - startedAt,
        retrievalDurationMs,
        generationDurationMs,
        retrievedChunks: evidence.length,
        sources,
        outcome: "success"
      });

      return { answer, sources };
    } catch (error) {
      this.logger.log({
        event: "answer",
        requestId,
        durationMs: Date.now() - startedAt,
        retrievalDurationMs,
        generationDurationMs,
        outcome: "error"
      });

      throw error;
    }
  }
}
