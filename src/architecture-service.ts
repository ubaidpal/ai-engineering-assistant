import type { AIProvider } from "./ai-provider.js";
import {
  validateRequest,
  type ArchitectureRequest
} from "./validation.js";

export class ArchitectureService {
  constructor(private readonly provider: AIProvider) {}

  async answer(
    request: ArchitectureRequest
  ): Promise<{ answer: string }> {
    const validRequest = validateRequest(request);
    const answer = await this.provider.answer(
      validRequest.question
    );

    if (!answer.trim()) {
      throw new Error("The AI provider returned no answer.");
    }

    return { answer: answer.trim() };
  }
}