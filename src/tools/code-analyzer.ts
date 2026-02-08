/**
 * Code analysis tool for enhanced codebase understanding
 * Analyzes code structure, dependencies, and relationships
 */

import { parse } from "@typescript-eslint/typescript-estree";
import { defineTool } from "./registry.js";
import { z } from "zod";

const fs = await import("node:fs/promises");
const path = await import("node:path");

export const AnalyzeFileSchema = z.object({
  filePath: z.string().describe("Path to file to analyze"),
  includeAst: z.boolean().default(false).describe("Include AST in result"),
});

export type AnalyzeFileInput = z.infer<typeof AnalyzeFileSchema>;

export interface FunctionInfo {
  name: string;
  line: number;
  params: string[];
  exported: boolean;
  async: boolean;
}

export interface ClassInfo {
  name: string;
  line: number;
  methods: string[];
  exported: boolean;
}

export interface ImportInfo {
  source: string;
  items: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  type: "function" | "class" | "variable" | "type";
}

export interface CodeAnalysisResult {
  filePath: string;
  language: string;
  lines: number;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  complexity: {
    cyclomatic: number;
    functions: number;
    classes: number;
    avgFunctionLength: number;
  };
  ast?: unknown;
}

/**
 * Analyze TypeScript/JavaScript file structure
 */
export async function analyzeFile(
  filePath: string,
  includeAst = false,
): Promise<CodeAnalysisResult> {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").length;

  const functions: FunctionInfo[] = [];
  const classes: ClassInfo[] = [];
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];

  let ast: unknown | undefined;

  try {
    ast = parse(content, {
      loc: true,
      range: true,
      comment: true,
      jsx: filePath.endsWith(".tsx") || filePath.endsWith(".jsx"),
      filePath,
    });

    // Extract functions, classes, imports, exports from AST
    // This is a simplified extraction
    const astAny = ast as {
      body?: Array<{
        type: string;
        declaration?: { type: string; id?: { name: string }; loc?: { start: { line: number } } };
        source?: { value: string };
        specifiers?: Array<{ local?: { name: string }; imported?: { name: string } }>;
      }>;
    };

    if (astAny.body) {
      for (const node of astAny.body) {
        if (node.type === "ImportDeclaration" && node.source && node.specifiers) {
          imports.push({
            source: node.source.value,
            items:
              node.specifiers
                .map((s) => s.imported?.name || s.local?.name)
                .filter((n): n is string => !!n) || [],
            isDefault: false,
            isNamespace: false,
          });
        }

        if (node.type === "ExportNamedDeclaration" && node.declaration) {
          const decl = node.declaration;
          if (decl.id?.name) {
            exports.push({
              name: decl.id.name,
              type: decl.type === "FunctionDeclaration" ? "function" : "variable",
            });

            if (decl.type === "FunctionDeclaration" && decl.loc) {
              functions.push({
                name: decl.id.name,
                line: decl.loc.start.line,
                params: [],
                exported: true,
                async: false,
              });
            }
          }
        }
      }
    }
  } catch {
    // If parsing fails, fall back to regex-based analysis
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(content)) !== null) {
      if (match[1]) {
        functions.push({
          name: match[1],
          line: content.substring(0, match.index).split("\n").length,
          params: [],
          exported: content.substring(match.index - 20, match.index).includes("export"),
          async: content.substring(match.index - 10, match.index).includes("async"),
        });
      }
    }

    const importRegex = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push({
          source: match[1],
          items: [],
          isDefault: false,
          isNamespace: false,
        });
      }
    }
  }

  const complexity = {
    cyclomatic: functions.length * 2 + classes.length * 3,
    functions: functions.length,
    classes: classes.length,
    avgFunctionLength: functions.length > 0 ? Math.floor(lines / functions.length) : 0,
  };

  return {
    filePath,
    language: filePath.endsWith(".ts") ? "typescript" : "javascript",
    lines,
    functions,
    classes,
    imports,
    exports,
    complexity,
    ...(includeAst ? { ast } : {}),
  };
}

/**
 * Analyze directory structure and dependencies
 */
export async function analyzeDirectory(dirPath: string): Promise<{
  totalFiles: number;
  totalLines: number;
  filesByType: Record<string, number>;
  largestFiles: Array<{ file: string; lines: number }>;
  mostComplex: Array<{ file: string; complexity: number }>;
}> {
  const { glob } = await import("glob");
  const files = await glob("**/*.{ts,tsx,js,jsx}", {
    cwd: dirPath,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    absolute: true,
  });

  let totalLines = 0;
  const filesByType: Record<string, number> = {};
  const fileStats: Array<{ file: string; lines: number; complexity: number }> = [];

  for (const file of files) {
    try {
      const analysis = await analyzeFile(file, false);
      totalLines += analysis.lines;

      const ext = path.extname(file);
      filesByType[ext] = (filesByType[ext] || 0) + 1;

      fileStats.push({
        file: path.relative(dirPath, file),
        lines: analysis.lines,
        complexity: analysis.complexity.cyclomatic,
      });
    } catch {
      // Skip files that fail to analyze
    }
  }

  fileStats.sort((a, b) => b.lines - a.lines);
  const largestFiles = fileStats.slice(0, 10).map(({ file, lines }) => ({ file, lines }));

  fileStats.sort((a, b) => b.complexity - a.complexity);
  const mostComplex = fileStats.slice(0, 10).map(({ file, complexity }) => ({ file, complexity }));

  return {
    totalFiles: files.length,
    totalLines,
    filesByType,
    largestFiles,
    mostComplex,
  };
}

/**
 * Tool: Analyze code file structure
 */
export const analyzeFileTool = defineTool({
  name: "analyzeFile",
  description:
    "Analyze TypeScript/JavaScript file structure and extract functions, classes, imports",
  category: "quality" as const,
  parameters: AnalyzeFileSchema,
  async execute(input) {
    const { filePath, includeAst } = input as AnalyzeFileInput;
    const result = await analyzeFile(filePath, includeAst);

    return {
      filePath: result.filePath,
      language: result.language,
      lines: result.lines,
      functionsCount: result.functions.length,
      classesCount: result.classes.length,
      importsCount: result.imports.length,
      exportsCount: result.exports.length,
      functions: result.functions,
      classes: result.classes,
      imports: result.imports,
      exports: result.exports,
      complexity: result.complexity,
    };
  },
});

/**
 * Tool: Analyze directory structure
 */
export const analyzeDirectoryTool = defineTool({
  name: "analyzeDirectory",
  description: "Analyze directory code structure, find largest and most complex files",
  category: "quality" as const,
  parameters: z.object({
    dirPath: z.string().describe("Directory path to analyze"),
  }),
  async execute(input) {
    const { dirPath } = input as { dirPath: string };
    const result = await analyzeDirectory(dirPath);

    return result;
  },
});

export const codeAnalyzerTools = [analyzeFileTool, analyzeDirectoryTool];
