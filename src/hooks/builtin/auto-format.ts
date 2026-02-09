/**
 * Auto-Format Hook
 *
 * Automatically formats code after writeFile/editFile operations
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { HookDefinition } from "../types.js";

/**
 * Check if oxfmt is available
 */
async function isOxfmtAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("oxfmt", ["--version"], { stdio: "ignore" });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Format a file using oxfmt
 */
async function formatFile(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("oxfmt", [filePath], { stdio: "inherit" });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Auto-format hook definition
 */
export const autoFormatHook: HookDefinition = {
  name: "auto-format",
  phase: "postToolUse",
  priority: 200, // Run after audit-log (100)
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

    // Make path absolute
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(session.projectPath, filePath);

    // Check if file exists
    if (!existsSync(absolutePath)) {
      return { action: "continue" };
    }

    // Check if oxfmt is available
    const hasOxfmt = await isOxfmtAvailable();
    if (!hasOxfmt) {
      // Silently skip if oxfmt not available
      return { action: "continue" };
    }

    // Format the file
    const formatted = await formatFile(absolutePath);

    if (formatted) {
      return {
        action: "continue",
        message: `[auto-format] Formatted ${path.basename(filePath)}`,
      };
    }

    return { action: "continue" };
  },
};
