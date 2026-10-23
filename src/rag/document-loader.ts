
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Document } from "./types.js";

export async function loadMarkdownDocuments(
  directory: string
): Promise<Document[]> {
  const entries = await readdir(directory, {
    withFileTypes: true
  });

  const filenames = entries
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith(".md")
    )
    .map((entry) => entry.name)
    .sort();

  const documents = await Promise.all(
    filenames.map(async (filename): Promise<Document> => {
      const filePath = path.join(directory, filename);
      const content = await readFile(filePath, "utf8");

      return {
        id: filename.replace(/\.md$/i, ""),
        source: filename,
        content
      };
    })
  );

  return documents;
}
