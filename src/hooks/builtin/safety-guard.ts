/**
 * Safety Guard Hook
 *
 * Blocks dangerous commands and operations for user protection
 */

import type { HookDefinition } from "../types.js";

/**
 * Dangerous command patterns
 */
const DANGEROUS_PATTERNS = [
  // Destructive filesystem operations
  /rm\s+-rf\s+\//, // rm -rf /
  /rm\s+-rf\s+\*/, // rm -rf *
  /rm\s+-rf\s+~\//, // rm -rf ~/
  /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/, // Fork bomb

  // Database operations
  /DROP\s+DATABASE/i, // DROP DATABASE
  /DELETE\s+FROM.*WHERE.*1\s*=\s*1/i, // DELETE FROM ... WHERE 1=1
  /TRUNCATE\s+TABLE/i, // TRUNCATE TABLE

  // System modifications
  /chmod\s+-R\s+777/, // chmod -R 777
  /sudo\s+rm/, // sudo rm
  /sudo\s+dd/, // sudo dd

  // Network attacks
  /:\s*\{\s*:\s*\|\s*:\s*&/, // Fork bomb variant
  /while\s+true.*curl/i, // Infinite request loops

  // Package management risks
  /npm\s+.*--force.*-g/, // npm global force install
  /pip\s+install.*--break-system-packages/, // pip break system
];

/**
 * Check if a command is dangerous
 */
function isDangerousCommand(command: string): string | null {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return pattern.toString();
    }
  }
  return null;
}

/**
 * Extract command from tool input
 */
function extractCommand(toolInput: unknown): string | null {
  if (typeof toolInput === "string") {
    return toolInput;
  }

  if (typeof toolInput === "object" && toolInput !== null) {
    const input = toolInput as Record<string, unknown>;

    // Check common command field names
    if (typeof input.command === "string") return input.command;
    if (typeof input.cmd === "string") return input.cmd;
    if (typeof input.script === "string") return input.script;
  }

  return null;
}

/**
 * Safety guard hook definition
 */
export const safetyGuardHook: HookDefinition = {
  name: "safety-guard",
  phase: "preToolUse",
  priority: 1, // Run before everything else

  handler: async (context) => {
    const { toolName, toolInput } = context;

    // Only check tools that execute commands
    const commandTools = ["bash", "shell", "execute", "run", "Bash"];
    if (!toolName || !commandTools.some((t) => toolName.toLowerCase().includes(t.toLowerCase()))) {
      return { action: "continue" };
    }

    // Extract command
    const command = extractCommand(toolInput);
    if (!command) {
      return { action: "continue" };
    }

    // Check for dangerous patterns
    const dangerousPattern = isDangerousCommand(command);
    if (dangerousPattern) {
      return {
        action: "abort",
        message: `[safety-guard] BLOCKED: Dangerous command detected (pattern: ${dangerousPattern})\nCommand: ${command}`,
      };
    }

    return { action: "continue" };
  },
};
