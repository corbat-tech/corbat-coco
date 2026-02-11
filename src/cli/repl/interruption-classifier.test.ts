/**
 * Tests for interruption classifier
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyInterruptions } from "./interruption-classifier.js";
import type { LLMProvider } from "../../providers/types.js";
import type { QueuedInterruption } from "./interruption-handler.js";

describe("classifyInterruptions", () => {
  let mockProvider: LLMProvider;

  beforeEach(() => {
    mockProvider = {
      chat: vi.fn(),
    } as unknown as LLMProvider;
  });

  describe("modify classification", () => {
    it("should classify 'also add validation' as modify", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "also add validation", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "modify",
          reasoning: "User wants to add validation to current task",
          synthesizedMessage: "Create a user service with validation",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("modify");
      expect(result.synthesizedMessage).toBe("Create a user service with validation");
    });

    it("should classify 'use PostgreSQL instead' as modify", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "use PostgreSQL instead", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "modify",
          reasoning: "User wants to change database technology",
          synthesizedMessage: "Create a database connection using PostgreSQL",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a database connection", mockProvider);

      expect(result.action).toBe("modify");
      expect(result.synthesizedMessage).toContain("PostgreSQL");
    });
  });

  describe("interrupt classification", () => {
    it("should classify 'stop' as interrupt", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "stop", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "interrupt",
          reasoning: "User wants to cancel current work",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("interrupt");
    });

    it("should classify 'cancel' as interrupt", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "cancel", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "interrupt",
          reasoning: "User wants to abort current work",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("interrupt");
    });
  });

  describe("queue classification", () => {
    it("should classify 'create a README' as queue", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "create a README", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "queue",
          reasoning: "This is an independent task",
          queuedTasks: [
            {
              title: "Create README",
              description: "Create a README file for the project",
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("queue");
      expect(result.queuedTasks).toHaveLength(1);
      expect(result.queuedTasks?.[0].title).toBe("Create README");
    });

    it("should classify 'add tests for X later' as queue", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "add tests for the auth module later", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "queue",
          reasoning: "This is a future task",
          queuedTasks: [
            {
              title: "Add tests for auth module",
              description: "Create unit tests for the authentication module",
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("queue");
      expect(result.queuedTasks).toHaveLength(1);
    });
  });

  describe("clarification classification", () => {
    it("should classify 'why did you choose X?' as clarification", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "why did you choose Express?", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "clarification",
          reasoning: "User is asking a question",
          response: "I chose Express because it's the most popular Node.js framework",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("clarification");
      expect(result.response).toContain("Express");
    });

    it("should classify 'what's the status?' as clarification", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "what's the status?", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "clarification",
          reasoning: "User wants to know progress",
          response: "Currently creating the database schema",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("clarification");
      expect(result.response).toBeTruthy();
    });
  });

  describe("multiple interruptions", () => {
    it("should combine multiple interruptions", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "add validation", timestamp: Date.now() },
        { message: "also add error handling", timestamp: Date.now() + 1000 },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "modify",
          reasoning: "User wants to add multiple features to current task",
          synthesizedMessage: "Create a user service with validation and error handling",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("modify");
      expect(result.synthesizedMessage).toContain("validation");
      expect(result.synthesizedMessage).toContain("error handling");
    });
  });

  describe("error handling", () => {
    it("should fallback to clarification if LLM fails", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "test message", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockRejectedValue(new Error("LLM API error"));

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("clarification");
      expect(result.response).toContain("test message");
    });

    it("should fallback if JSON parsing fails", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "test message", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: "This is not JSON",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("clarification");
    });

    it("should fallback if action is invalid", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "test message", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: JSON.stringify({
          action: "invalid_action",
          reasoning: "Something wrong",
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("clarification");
    });
  });

  describe("JSON extraction", () => {
    it("should extract JSON from markdown code block", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "add validation", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: '```json\n{"action": "modify", "reasoning": "User wants validation", "synthesizedMessage": "Create user service with validation"}\n```',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("modify");
    });

    it("should extract JSON from text with surrounding content", async () => {
      const interruptions: QueuedInterruption[] = [
        { message: "add validation", timestamp: Date.now() },
      ];

      vi.mocked(mockProvider.chat).mockResolvedValue({
        content: 'Here is the classification: {"action": "modify", "reasoning": "User wants validation", "synthesizedMessage": "Create user service with validation"} - done!',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      });

      const result = await classifyInterruptions(interruptions, "Create a user service", mockProvider);

      expect(result.action).toBe("modify");
    });
  });
});
