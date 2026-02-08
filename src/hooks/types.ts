/**
 * Lifecycle Hooks System - Types and Interfaces
 *
 * Provides a flexible hook system similar to Claude Code's PreToolUse/PostToolUse hooks.
 * Allows users to intercept and modify tool execution at various lifecycle phases.
 */

/**
 * Hook execution phases
 */
export type HookPhase =
  | "preToolUse" // Before tool execution
  | "postToolUse" // After tool execution
  | "prePhase" // Before COCO phase
  | "postPhase" // After COCO phase
  | "onError" // On error occurrence
  | "onStop"; // On session stop

/**
 * Context provided to hook handlers
 */
export interface HookContext {
  /** Current hook phase */
  phase: HookPhase;

  /** Tool name (if applicable) */
  toolName?: string;

  /** Tool input parameters (if applicable) */
  toolInput?: unknown;

  /** Tool output/result (if applicable) */
  toolOutput?: unknown;

  /** Error object (if phase is onError) */
  error?: Error;

  /** Session metadata */
  session: {
    projectPath: string;
    provider: string;
    model: string;
  };

  /** Cancel the current operation */
  abort: () => void;

  /** Modify tool input/output */
  modify: (data: unknown) => void;
}

/**
 * Hook execution result
 */
export interface HookResult {
  /** Action to take after hook execution */
  action: "continue" | "skip" | "abort" | "modify";

  /** Modified data (if action is "modify") */
  data?: unknown;

  /** Optional message to display to user */
  message?: string;
}

/**
 * Hook definition
 */
export interface HookDefinition {
  /** Unique hook name */
  name: string;

  /** Phase when this hook should run */
  phase: HookPhase;

  /** Execution priority (lower = runs first) */
  priority?: number;

  /** Whether this hook is enabled */
  enabled?: boolean;

  /** Glob pattern for tool names (e.g., "bash*", "file*") */
  pattern?: string;

  /** Hook handler function */
  handler: (context: HookContext) => Promise<HookResult>;
}

/**
 * Hook configuration in .corbat.json
 */
export interface HookConfig {
  /** Hook name */
  name: string;

  /** Whether this hook is enabled */
  enabled: boolean;

  /** Tool name pattern (optional) */
  pattern?: string;

  /** Priority (optional) */
  priority?: number;
}

/**
 * Hooks configuration structure
 */
export interface HooksConfiguration {
  preToolUse?: HookConfig[];
  postToolUse?: HookConfig[];
  prePhase?: HookConfig[];
  postPhase?: HookConfig[];
  onError?: HookConfig[];
  onStop?: HookConfig[];
}
