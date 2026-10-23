import "dotenv/config";
import { ArchitectureService } from "./architecture-service.js";
import { OpenAIProvider } from "./openai-provider.js";
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
const service = new ArchitectureService(provider);
const app = buildServer({ service });

try {
  await app.listen({ port, host: "127.0.0.1" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}
