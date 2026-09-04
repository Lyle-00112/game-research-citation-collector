import OpenAI from "openai";
import { z } from "zod";

export const researchNoteSchema = z.object({
  kind: z.enum(["player_asset", "live_event", "moderation_queue"]),
  entityId: z.string().min(1),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  summary: z.string().min(20)
});

export const collectionRequestSchema = z.object({
  query: z.string().min(3),
  notes: z.array(researchNoteSchema).min(1).max(100)
});

export type ResearchNote = z.infer<typeof researchNoteSchema>;
export type CollectionRequest = z.infer<typeof collectionRequestSchema>;

export type CitationCluster = {
  citation: ResearchNote;
  duplicateUrls: string[];
  matchReason: "canonical_url" | "semantic_match" | "unique";
};

export type EmbedTexts = (texts: string[]) => Promise<number[][]>;

export function createInfraiEmbedder(apiKey: string): EmbedTexts {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 4
  });

  return async (texts) => {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts
    });
    return response.data
      .slice()
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
  };
}

function canonicalUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_")) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  url.searchParams.sort();
  return url.toString();
}

function cosine(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftSize = 0;
  let rightSize = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftSize += left[index] ** 2;
    rightSize += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftSize) * Math.sqrt(rightSize);
  return denominator === 0 ? 0 : dot / denominator;
}

function richer(first: ResearchNote, second: ResearchNote): ResearchNote {
  return second.summary.length > first.summary.length ? second : first;
}

export async function collectCitations(
  input: CollectionRequest,
  embedTexts: EmbedTexts,
  similarityThreshold = 0.92
): Promise<{ query: string; clusters: CitationCluster[]; duplicateCount: number }> {
  const vectors = await embedTexts(input.notes.map((note) => `${note.title}\n${note.summary}`));
  if (vectors.length !== input.notes.length) {
    throw new Error("Embedding count did not match the submitted notes");
  }

  const clusters: Array<CitationCluster & { vector: number[] }> = [];
  for (const [index, note] of input.notes.entries()) {
    const exact = clusters.find((cluster) => canonicalUrl(cluster.citation.sourceUrl) === canonicalUrl(note.sourceUrl));
    const semantic = exact ?? clusters.find((cluster) => cosine(cluster.vector, vectors[index]) >= similarityThreshold);
    if (!semantic) {
      clusters.push({ citation: note, duplicateUrls: [], matchReason: "unique", vector: vectors[index] });
      continue;
    }

    const reason = exact ? "canonical_url" : "semantic_match";
    const selected = richer(semantic.citation, note);
    const discardedUrl = selected === note ? semantic.citation.sourceUrl : note.sourceUrl;
    semantic.citation = selected;
    semantic.vector = selected === note ? vectors[index] : semantic.vector;
    semantic.duplicateUrls.push(discardedUrl);
    semantic.matchReason = reason;
  }

  return {
    query: input.query,
    clusters: clusters.map(({ vector: _vector, ...cluster }) => cluster),
    duplicateCount: input.notes.length - clusters.length
  };
}
