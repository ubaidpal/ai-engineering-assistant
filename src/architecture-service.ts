import type { ChunkRetriever } from "./rag/chunk-retriever.js";
import type { RAGAIProvider } from "./rag/rag-ai-provider.js";
import { RAGAnswerService } from "./rag/rag-answer-service.js";
import {
  validateRequest,
  type ArchitectureRequest
} from "./validation.js";

export class ArchitectureService {
  private readonly ragAnswerService: RAGAnswerService;

  constructor(
    provider: RAGAIProvider,
    retriever: ChunkRetriever
  ) {
    this.ragAnswerService = new RAGAnswerService(retriever, provider);
  }

  async answer(
    request: ArchitectureRequest
  ): Promise<{ answer: string }> {
    const validRequest = validateRequest(request);
    const result = await this.ragAnswerService.answer(validRequest.question);

    return { answer: result.answer };
  }
}
