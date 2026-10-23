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

  async answer(question: string): Promise<RAGAnswer> {
    const startedAt = Date.now();

    try {
      const evidence = await this.retriever.retrieve(
        question,
        3,
        this.options.minScore,
        this.options.maxPerSource
      );

      if (evidence.length === 0) {
        this.logger.log({
          event: "answer",
          durationMs: Date.now() - startedAt,
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

      const answer = (
        await this.aiProvider.answerWithContext(question, evidence)
      ).trim();

      if (!answer) {
        throw new Error("The AI provider returned no answer.");
      }

      const sources = [...new Set(evidence.map((chunk) => chunk.source))];

      this.logger.log({
        event: "answer",
        durationMs: Date.now() - startedAt,
        retrievedChunks: evidence.length,
        sources,
        outcome: "success"
      });

      return { answer, sources };
    } catch (error) {
      this.logger.log({
        event: "answer",
        durationMs: Date.now() - startedAt,
        outcome: "error"
      });

      throw error;
    }
  }
}
