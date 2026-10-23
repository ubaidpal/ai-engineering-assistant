
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarkdownDocuments } from "./document-loader.js";
import { RAGService } from "./rag-service.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export async function createKnowledgeBase(): Promise<RAGService> {
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

  return new RAGService(documents);
}
