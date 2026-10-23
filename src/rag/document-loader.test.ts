
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadMarkdownDocuments } from "./document-loader.js";

describe("loadMarkdownDocuments", () => {
  let tempDirectory: string | undefined;

  afterEach(async () => {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      tempDirectory = undefined;
    }
  });

  it("loads Markdown files and ignores other file types", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "rag-docs-")
    );

    await writeFile(
      path.join(tempDirectory, "modular-monolith.md"),
      "# Modular Monolith\nSimple deployment."
    );

    await writeFile(
      path.join(tempDirectory, "notes.txt"),
      "Ignore this file."
    );

    const documents = await loadMarkdownDocuments(tempDirectory);

    expect(documents).toHaveLength(1);
    expect(documents[0]).toEqual({
      id: "modular-monolith",
      source: "modular-monolith.md",
      content: "# Modular Monolith\nSimple deployment."
    });
  });

  it("returns an empty list for an empty directory", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "rag-empty-")
    );

    expect(await loadMarkdownDocuments(tempDirectory)).toEqual([]);
  });

  it("throws when the directory does not exist", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "rag-missing-")
    );

    const missingDirectory = path.join(tempDirectory, "missing");

    await expect(
      loadMarkdownDocuments(missingDirectory)
    ).rejects.toThrow();
  });
});
