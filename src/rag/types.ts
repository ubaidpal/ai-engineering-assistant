export type Document = {
  id: string;
  source: string;
  content: string;
};

export type DocumentChunk = {
  id: string;
  documentId: string;
  source: string;
  content: string;
};

export type RetrievedChunk = DocumentChunk & {
  score: number;
};
