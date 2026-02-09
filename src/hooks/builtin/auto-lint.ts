/**
 * Auto-Lint Hook
 *
 * Automatically runs linter after code changes
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { HookDefinition } from "../types.js";

/**
 * Check if oxlint is available
 */
async function isOxlintAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("oxlint", ["--version"], { stdio: "ignore" });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Lint a file using oxlint
 */
async function lintFile(filePath: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    let output = "";

    const proc = spawn("oxlint", [filePath]);

    proc.stdout?.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: output.trim(),
      });
    });

    proc.on("error", () => {
      resolve({ success: false, output: "Linter not available" });
    });
  });
}

/**
 * Check if file should be linted
 */
function shouldLintFile(filePath: string): boolean {
  const lintableExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
  const ext = path.extname(filePath).toLowerCase();
  return lintableExtensions.includes(ext);
}

/**
 * Auto-lint hook definition
 */
export const autoLintHook: HookDefinition = {
  name: "auto-lint",
  phase: "postToolUse",
  priority: 300, // Run after auto-format (200)
  pattern: "writeFile|editFile|Write|Edit",

  handler: async (context) => {
    const { toolOutput, session } = context;

    // Extract file path from tool output
    let filePath: string | undefined;

    if (typeof toolOutput === "object" && toolOutput !== null) {
      const output = toolOutput as Record<string, unknown>;
      filePath = (output.filePath as string) ?? (output.file_path as string);
    }

    if (!filePath) {
      return { action: "continue" };
    }

    // Check if file should be linted
    if (!shouldLintFile(filePath)) {
      return { action: "continue" };
    }

    // Make path absolute
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(session.projectPath, filePath);

    // Check if file exists
    if (!existsSync(absolutePath)) {
      return { action: "continue" };
    }

    // Check if oxlint is available
    const hasOxlint = await isOxlintAvailable();
    if (!hasOxlint) {
      // Silently skip if oxlint not available
      return { action: "continue" };
    }

    // Lint the file
    const result = await lintFile(absolutePath);

    if (result.success) {
      return {
        action: "continue",
        message: `[auto-lint] ✓ ${path.basename(filePath)} passed linting`,
      };
    } else if (result.output) {
      return {
        action: "continue",
        message: `[auto-lint] ⚠ ${path.basename(filePath)} has lint warnings:\n${result.output}`,
      };
    }

    return { action: "continue" };
  },
};
