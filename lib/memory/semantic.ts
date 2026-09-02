import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
  "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
  "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through",
  "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
  "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
  "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
  "you've", "your", "yours", "yourself", "yourselves"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export interface ScoredMemory {
  id: string;
  category: string;
  fact: string;
  score: number;
  createdAt: Date;
}

/**
 * Retrieves the most relevant memories for a companion conversation using local semantic BM25 scoring.
 */
export async function getRelevantMemories(
  userId: string,
  characterId: string,
  queryText: string,
  limit: number = 8
): Promise<string[]> {
  try {
    const allMemories = await prisma.companionMemory.findMany({
      where: {
        userId,
        characterId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allMemories.length === 0) return [];
    if (allMemories.length <= limit) {
      return allMemories.map((m) => `• [${m.category.toUpperCase()}] ${m.fact}`);
    }

    const queryTokens = tokenize(queryText);
    if (queryTokens.length === 0) {
      // Return most recent memories if query tokens are empty
      return allMemories
        .slice(0, limit)
        .map((m) => `• [${m.category.toUpperCase()}] ${m.fact}`);
    }

    // Score memories
    const scored: ScoredMemory[] = allMemories.map((mem, index) => {
      const memTokens = tokenize(mem.fact);
      let matchCount = 0;

      for (const qToken of queryTokens) {
        for (const mToken of memTokens) {
          if (mToken === qToken) {
            matchCount += 1.0;
          } else if (mToken.includes(qToken) || qToken.includes(mToken)) {
            matchCount += 0.5;
          }
        }
      }

      // Compute term frequency score
      const tfScore = memTokens.length > 0 ? matchCount / Math.sqrt(memTokens.length) : 0;

      // Gentle recency bias for tie-breaking
      const recencyBonus = 0.05 * (1 - index / allMemories.length);

      return {
        id: mem.id,
        category: mem.category,
        fact: mem.fact,
        score: tfScore + recencyBonus,
        createdAt: mem.createdAt,
      };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.score - a.score);

    // Pick top relevant memories, mixing in top scored and top recent
    const topScored = scored.filter((s) => s.score > 0.1).slice(0, limit);

    // If fewer than limit had strong matches, pad with recent
    const selectedIds = new Set(topScored.map((s) => s.id));
    for (const mem of allMemories) {
      if (topScored.length >= limit) break;
      if (!selectedIds.has(mem.id)) {
        topScored.push({
          id: mem.id,
          category: mem.category,
          fact: mem.fact,
          score: 0,
          createdAt: mem.createdAt,
        });
        selectedIds.add(mem.id);
      }
    }

    return topScored.map((m) => `• [${m.category.toUpperCase()}] ${m.fact}`);
  } catch (err) {
    console.error("getRelevantMemories error:", err);
    return [];
  }
}
