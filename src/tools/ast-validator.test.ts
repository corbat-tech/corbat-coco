import { describe, expect, it } from "vitest";
import { validateCode, extractImports, findMissingImports } from "./ast-validator.js";

describe("ast-validator", () => {
  describe("validateCode", () => {
    it("should validate correct TypeScript code", async () => {
      const code = `
        export function hello(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;
      const result = await validateCode(code, "test.ts", "typescript");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect syntax errors", async () => {
      const code = "const x = {";
      const result = await validateCode(code, "test.ts", "typescript");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should warn about any types", async () => {
      const code = "const x: any = 5;";
      const result = await validateCode(code, "test.ts", "typescript");
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("extractImports", () => {
    it("should extract import statements", () => {
      const code = `
        import { foo } from "bar";
        import baz from "qux";
      `;
      const imports = extractImports(code);
      expect(imports).toContain("bar");
      expect(imports).toContain("qux");
    });

    it("should return empty array for no imports", () => {
      const code = "const x = 5;";
      const imports = extractImports(code);
      expect(imports).toHaveLength(0);
    });
  });

  describe("findMissingImports", () => {
    it("should detect missing fs import", () => {
      const code = "const file = fs.readFile('test');";
      const missing = findMissingImports(code, "test.ts");
      expect(missing).toContain("node:fs/promises");
    });

    it("should not report false positives", () => {
      const code = `
        import fs from "node:fs/promises";
        const file = fs.readFile('test');
      `;
      const missing = findMissingImports(code, "test.ts");
      expect(missing).toHaveLength(0);
    });
  });
});
