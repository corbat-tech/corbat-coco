/**
 * Context Enhancement Tool
 * Intelligent context loading and session-level learning
 */

import { defineTool } from "./registry.js";
import { z } from "zod";

const fs = await import("node:fs/promises");
const path = await import("node:path");

export interface ContextItem {
  type: "file" | "conversation" | "decision" | "pattern";
  content: string;
  timestamp: number;
  relevance: number;
  tags: string[];
}

export interface LearningEntry {
  pattern: string;
  userPreference: string;
  frequency: number;
  lastUsed: number;
}

/**
 * Context memory store
 */
export class ContextMemoryStore {
  private items: Map<string, ContextItem> = new Map();
  private learnings: Map<string, LearningEntry> = new Map();
  private sessionId: string;
  private storePath: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.storePath = `.coco/context/${sessionId}.json`;
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storePath, "utf-8");
      const data = JSON.parse(content);

      this.items = new Map(Object.entries(data.items || {}));
      this.learnings = new Map(Object.entries(data.learnings || {}));
    } catch {
      // File doesn't exist yet, start fresh
    }
  }

  async save(): Promise<void> {
    const dir = path.dirname(this.storePath);
    await fs.mkdir(dir, { recursive: true });

    const data = {
      sessionId: this.sessionId,
      items: Object.fromEntries(this.items),
      learnings: Object.fromEntries(this.learnings),
      savedAt: Date.now(),
    };

    await fs.writeFile(this.storePath, JSON.stringify(data, null, 2));
  }

  addContext(id: string, item: ContextItem): void {
    this.items.set(id, item);
  }

  getContext(id: string): ContextItem | undefined {
    return this.items.get(id);
  }

  getRelevantContext(query: string, limit = 5): ContextItem[] {
    const results: Array<{ item: ContextItem; score: number }> = [];

    for (const item of this.items.values()) {
      let score = 0;

      // Simple relevance scoring
      const queryLower = query.toLowerCase();
      const contentLower = item.content.toLowerCase();

      if (contentLower.includes(queryLower)) score += 10;

      for (const tag of item.tags) {
        if (queryLower.includes(tag.toLowerCase())) score += 5;
      }

      // Recency bonus
      const age = Date.now() - item.timestamp;
      const dayMs = 24 * 60 * 60 * 1000;
      if (age < dayMs) score += 3;
      else if (age < 7 * dayMs) score += 1;

      if (score > 0) {
        results.push({ item, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map((r) => r.item);
  }

  recordLearning(pattern: string, preference: string): void {
    const existing = this.learnings.get(pattern);

    if (existing) {
      existing.frequency++;
      existing.lastUsed = Date.now();
      if (existing.userPreference !== preference) {
        existing.userPreference = preference; // Update to latest preference
      }
    } else {
      this.learnings.set(pattern, {
        pattern,
        userPreference: preference,
        frequency: 1,
        lastUsed: Date.now(),
      });
    }
  }

  getLearning(pattern: string): LearningEntry | undefined {
    return this.learnings.get(pattern);
  }

  getFrequentPatterns(limit = 10): LearningEntry[] {
    return Array.from(this.learnings.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }
}

/**
 * Tool: Add context to session memory
 */
export const addContextTool = defineTool({
  name: "addContext",
  description: "Add important context to session memory for later retrieval",
  category: "build" as const,
  parameters: z.object({
    type: z.enum(["file", "conversation", "decision", "pattern"]),
    content: z.string(),
    tags: z.array(z.string()).default([]),
  }),

  async execute(input) {
    const typedInput = input as {
      type: "file" | "conversation" | "decision" | "pattern";
      content: string;
      tags: string[];
    };

    const sessionId = `session-${Date.now()}`;
    const store = new ContextMemoryStore(sessionId);
    await store.load();

    const id = `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    store.addContext(id, {
      type: typedInput.type,
      content: typedInput.content,
      timestamp: Date.now(),
      relevance: 1.0,
      tags: typedInput.tags,
    });

    await store.save();

    return {
      contextId: id,
      type: typedInput.type,
      stored: true,
      message: "Context added to session memory",
    };
  },
});

/**
 * Tool: Retrieve relevant context
 */
export const getRelevantContextTool = defineTool({
  name: "getRelevantContext",
  description: "Retrieve relevant context from session memory based on query",
  category: "build" as const,
  parameters: z.object({
    query: z.string(),
    limit: z.number().default(5),
  }),

  async execute(input) {
    const typedInput = input as { query: string; limit: number };

    const sessionId = `session-${Date.now()}`;
    const store = new ContextMemoryStore(sessionId);
    await store.load();

    const relevant = store.getRelevantContext(typedInput.query, typedInput.limit);

    return {
      query: typedInput.query,
      resultsFound: relevant.length,
      contexts: relevant.map((item) => ({
        type: item.type,
        content: item.content.substring(0, 200), // Truncate for display
        tags: item.tags,
        timestamp: new Date(item.timestamp).toISOString(),
      })),
    };
  },
});

/**
 * Tool: Record user preference/learning
 */
export const recordLearningTool = defineTool({
  name: "recordLearning",
  description: "Record user preference or decision pattern for future reference",
  category: "build" as const,
  parameters: z.object({
    pattern: z.string().describe("The pattern or situation"),
    preference: z.string().describe("User's preferred handling"),
  }),

  async execute(input) {
    const typedInput = input as { pattern: string; preference: string };

    const sessionId = `session-${Date.now()}`;
    const store = new ContextMemoryStore(sessionId);
    await store.load();

    store.recordLearning(typedInput.pattern, typedInput.preference);
    await store.save();

    const learning = store.getLearning(typedInput.pattern);

    return {
      pattern: typedInput.pattern,
      preference: typedInput.preference,
      frequency: learning?.frequency || 1,
      message: "Learning recorded for future reference",
    };
  },
});

/**
 * Tool: Get learned patterns
 */
export const getLearnedPatternsTool = defineTool({
  name: "getLearnedPatterns",
  description: "Get frequently occurring patterns and user preferences",
  category: "build" as const,
  parameters: z.object({
    limit: z.number().default(10),
  }),

  async execute(input) {
    const typedInput = input as { limit: number };

    const sessionId = `session-${Date.now()}`;
    const store = new ContextMemoryStore(sessionId);
    await store.load();

    const patterns = store.getFrequentPatterns(typedInput.limit);

    return {
      totalPatterns: patterns.length,
      patterns: patterns.map((p) => ({
        pattern: p.pattern,
        preference: p.userPreference,
        frequency: p.frequency,
        lastUsed: new Date(p.lastUsed).toISOString(),
      })),
    };
  },
});

export const contextEnhancerTools = [
  addContextTool,
  getRelevantContextTool,
  recordLearningTool,
  getLearnedPatternsTool,
];
