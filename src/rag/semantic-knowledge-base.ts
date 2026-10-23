import path from "node:path";
import { fileURLToPath } from "node:url";
import { chunkDocument } from "./chunker.js";
import { loadMarkdownDocuments } from "./document-loader.js";
import { OpenAIEmbeddingProvider } from "./openai-embedding-provider.js";
import { PersistentEmbeddingProvider } from "./persistent-embedding-provider.js";
import { SemanticRetriever } from "./semantic-retriever.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export async function createSemanticKnowledgeBase(
  apiKey: string,
  baseURL?: string
): Promise<SemanticRetriever> {
  const knowledgeDirectory = path.resolve(
    currentDirectory,
    "../../knowledge"
  );

  const documents = await loadMarkdownDocuments(knowledgeDirectory);

  if (documents.length === 0) {
    throw new Error(
      `No Markdown documents found in ${knowledgeDirectory}`
    );
  }

  const chunks = documents.flatMap((document) => chunkDocument(document));

  if (chunks.length === 0) {
    throw new Error("Knowledge documents contain no usable content.");
  }

  const embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  const embeddingProvider = new PersistentEmbeddingProvider(
    new OpenAIEmbeddingProvider(apiKey, embeddingModel, baseURL),
    path.resolve(currentDirectory, "../../.cache/embeddings.json"),
    embeddingModel
  );

  // Remove cached embeddings for chunks that no longer exist.
  await embeddingProvider.retainOnly(chunks.map((chunk) => chunk.content));

  return SemanticRetriever.create(chunks, embeddingProvider);
}
