import { describe, expect, it } from "vitest";
import { analyzeTask, recommendTools } from "./tool-recommender.js";
import type { ToolDefinition } from "./registry.js";
import { z } from "zod";

describe("tool-recommender", () => {
  describe("analyzeTask", () => {
    it("should detect fix_bug intent", () => {
      const analysis = analyzeTask("Fix the bug in auth.ts");
      expect(analysis.intent).toBe("fix_bug");
      expect(analysis.context).toContain("auth.ts");
    });

    it("should detect read_file intent", () => {
      const analysis = analyzeTask("Read the content of config.json");
      expect(analysis.intent).toBe("read_file");
    });

    it("should detect search_code intent", () => {
      const analysis = analyzeTask("Search for the function getUserById");
      expect(analysis.intent).toBe("search_code");
    });

    it("should extract file paths from context", () => {
      const analysis = analyzeTask("Check src/index.ts for errors");
      expect(analysis.context).toContain("src/index.ts");
    });
  });

  describe("recommendTools", () => {
    const mockTools: ToolDefinition[] = [
      {
        name: "readFile",
        description: "Read file contents from disk",
        category: "file",
        parameters: z.object({}),
        execute: async () => ({}),
      },
      {
        name: "validateCode",
        description: "Validate code syntax using AST",
        category: "quality",
        parameters: z.object({}),
        execute: async () => ({}),
      },
    ];

    it("should recommend tools based on task", () => {
      const recommendations = recommendTools("Read the file", mockTools, 5);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]?.tool.name).toBe("readFile");
    });

    it("should score tools appropriately", () => {
      const recommendations = recommendTools("Validate code quality", mockTools, 5);
      const validateTool = recommendations.find((r) => r.tool.name === "validateCode");
      expect(validateTool).toBeDefined();
      expect(validateTool!.score).toBeGreaterThan(0);
    });

    it("should limit results to requested number", () => {
      const recommendations = recommendTools("Any task", mockTools, 1);
      expect(recommendations.length).toBeLessThanOrEqual(1);
    });
  });
});
