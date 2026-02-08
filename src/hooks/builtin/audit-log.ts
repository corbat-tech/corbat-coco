/**
 * Audit Log Hook
 *
 * Records all tool operations to .coco/audit.log for transparency
 */

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { HookDefinition } from "../types.js";

/**
 * Format timestamp in ISO format
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Write audit log entry
 */
async function writeAuditLog(projectPath: string, entry: string): Promise<void> {
  const auditDir = path.join(projectPath, ".coco");
  const auditFile = path.join(auditDir, "audit.log");

  try {
    // Ensure .coco directory exists
    await mkdir(auditDir, { recursive: true });

    // Append to audit log
    await appendFile(auditFile, entry + "\n", "utf-8");
  } catch (error) {
    // Silently fail - don't block operations
    console.error("Failed to write audit log:", error);
  }
}

/**
 * Pre-tool-use audit hook
 */
export const auditLogPreHook: HookDefinition = {
  name: "audit-log-pre",
  phase: "preToolUse",
  priority: 10, // Run first

  handler: async (context) => {
    const { toolName, toolInput, session } = context;

    const entry = JSON.stringify({
      timestamp: timestamp(),
      phase: "pre",
      tool: toolName,
      input: toolInput,
      provider: session.provider,
      model: session.model,
    });

    await writeAuditLog(session.projectPath, entry);

    return { action: "continue" };
  },
};

/**
 * Post-tool-use audit hook
 */
export const auditLogPostHook: HookDefinition = {
  name: "audit-log-post",
  phase: "postToolUse",
  priority: 10, // Run first

  handler: async (context) => {
    const { toolName, toolOutput, session } = context;

    // Sanitize output (truncate if too large)
    let sanitizedOutput = toolOutput;
    if (typeof toolOutput === "string" && toolOutput.length > 1000) {
      sanitizedOutput = toolOutput.substring(0, 1000) + "... (truncated)";
    }

    const entry = JSON.stringify({
      timestamp: timestamp(),
      phase: "post",
      tool: toolName,
      output: sanitizedOutput,
      provider: session.provider,
      model: session.model,
    });

    await writeAuditLog(session.projectPath, entry);

    return { action: "continue" };
  },
};
