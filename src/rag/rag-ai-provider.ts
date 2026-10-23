import type { RetrievedChunk } from "./types.js";

export interface RAGAIProvider {
  answerWithContext(
    question: string,
    evidence: RetrievedChunk[]
  ): Promise<string>;
}
