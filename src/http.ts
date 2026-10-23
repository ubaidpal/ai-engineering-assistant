import "dotenv/config";
import { ArchitectureService } from "./architecture-service.js";
import { OpenAIProvider } from "./openai-provider.js";
import { createKnowledgeBase } from "./rag/knowledge-base.js";
import { RAGAnswerService } from "./rag/rag-answer-service.js";
import { createSemanticKnowledgeBase } from "./rag/semantic-knowledge-base.js";
import { buildServer } from "./server.js";

const apiKey = process.env.EXPLABS_API_KEY;
const model = process.env.EXPLABS_MODEL || "deepseek-v4.1-flash";
const baseURL =
  process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";
const port = Number(process.env.PORT ?? 3000);

if (!apiKey) {
  throw new Error("Missing EXPLABS_API_KEY configuration.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const provider = new OpenAIProvider(model, apiKey, baseURL);
const knowledgeBase = await createKnowledgeBase();
const service = new ArchitectureService(provider, knowledgeBase);
const ragAnswerService = new RAGAnswerService(knowledgeBase, provider);

let semanticKnowledgeBase;

try {
  semanticKnowledgeBase = await createSemanticKnowledgeBase(
    apiKey,
    baseURL
  );
} catch (error) {
  console.error(
    "Failed to build semantic knowledge base:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

const semanticRagAnswerService = new RAGAnswerService(
  semanticKnowledgeBase,
  provider,
  {
    minScore: 0.8,
    maxPerSource: 1
  }
);

const app = buildServer({
  service,
  ragAnswerService,
  semanticRagAnswerService
});

try {
  await app.listen({ port, host: "127.0.0.1" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}
