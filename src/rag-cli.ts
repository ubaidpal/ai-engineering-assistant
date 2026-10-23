import "dotenv/config";
import { OpenAIProvider } from "./openai-provider.js";
import { createKnowledgeBase } from "./rag/knowledge-base.js";
import { RAGAnswerService } from "./rag/rag-answer-service.js";

async function main(): Promise<void> {
  const apiKey = process.env.EXPLABS_API_KEY;
  const model = process.env.EXPLABS_MODEL || "deepseek-v4.1-flash";
  const baseURL =
    process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";

  if (!apiKey) {
    throw new Error("Missing EXPLABS_API_KEY configuration.");
  }

  const question = process.argv.slice(2).join(" ").trim();

  if (!question) {
    throw new Error(
      'Please provide a question, e.g. npm run rag -- "When should I use a modular monolith?"'
    );
  }

  if (question.length > 2000) {
    throw new Error("Question must not exceed 2000 characters.");
  }

  const knowledgeBase = await createKnowledgeBase();
  const provider = new OpenAIProvider(model, apiKey, baseURL);
  const service = new RAGAnswerService(knowledgeBase, provider);

  const result = await service.answer(question);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    "RAG request failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
