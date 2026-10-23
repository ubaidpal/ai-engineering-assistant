export type RAGLogEvent = {
  event: string;
  requestId?: string;
  durationMs?: number;
  retrievalDurationMs?: number;
  generationDurationMs?: number;
  retrievedChunks?: number;
  sources?: string[];
  outcome?: "success" | "empty" | "error";
};

export interface RAGLogger {
  log(event: RAGLogEvent): void;
}

export class ConsoleRAGLogger implements RAGLogger {
  log(event: RAGLogEvent): void {
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        component: "rag",
        ...event
      })
    );
  }
}
