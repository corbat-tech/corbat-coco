/**
 * Hook Registry - Manages hook registration and execution
 */

import { minimatch } from "minimatch";
import type { HookDefinition, HookPhase, HookContext, HookResult } from "./types.js";

/**
 * Registry for managing lifecycle hooks
 */
export class HookRegistry {
  private hooks = new Map<string, HookDefinition>();

  /**
   * Register a new hook
   */
  register(hook: HookDefinition): void {
    if (this.hooks.has(hook.name)) {
      throw new Error(`Hook "${hook.name}" is already registered`);
    }

    // Set defaults
    const hookWithDefaults: HookDefinition = {
      ...hook,
      priority: hook.priority ?? 100,
      enabled: hook.enabled ?? true,
    };

    this.hooks.set(hook.name, hookWithDefaults);
  }

  /**
   * Unregister a hook by name
   */
  unregister(name: string): boolean {
    return this.hooks.delete(name);
  }

  /**
   * Get all hooks for a specific phase
   */
  getHooks(phase: HookPhase, toolName?: string): HookDefinition[] {
    const hooks = Array.from(this.hooks.values())
      .filter((hook) => {
        // Must match phase
        if (hook.phase !== phase) return false;

        // Must be enabled
        if (hook.enabled === false) return false;

        // If pattern is specified and we have a toolName, check pattern match
        if (hook.pattern && toolName) {
          return minimatch(toolName, hook.pattern);
        }

        // If pattern is specified but no toolName, don't include
        if (hook.pattern && !toolName) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    return hooks;
  }

  /**
   * Execute all hooks for a phase
   * Returns the final result after all hooks have been processed
   */
  async executeHooks(context: HookContext): Promise<HookResult> {
    const hooks = this.getHooks(context.phase, context.toolName);

    let currentData = context.toolInput ?? context.toolOutput;
    let shouldAbort = false;
    let shouldSkip = false;
    let messages: string[] = [];

    for (const hook of hooks) {
      try {
        // Create context with current data
        const hookContext: HookContext = {
          ...context,
          toolInput: context.phase === "preToolUse" ? currentData : context.toolInput,
          toolOutput: context.phase === "postToolUse" ? currentData : context.toolOutput,
          abort: () => {
            shouldAbort = true;
          },
          modify: (data: unknown) => {
            currentData = data;
          },
        };

        const result = await hook.handler(hookContext);

        // Handle result actions
        switch (result.action) {
          case "abort":
            shouldAbort = true;
            if (result.message) messages.push(result.message);
            break;

          case "skip":
            shouldSkip = true;
            if (result.message) messages.push(result.message);
            break;

          case "modify":
            if (result.data !== undefined) {
              currentData = result.data;
            }
            if (result.message) messages.push(result.message);
            break;

          case "continue":
            if (result.message) messages.push(result.message);
            break;
        }

        // Stop execution if abort or skip requested
        if (shouldAbort || shouldSkip) {
          break;
        }
      } catch (error) {
        // Hook execution failed, log but continue with other hooks
        console.error(`Hook "${hook.name}" failed:`, error);
      }
    }

    // Determine final action
    if (shouldAbort) {
      return {
        action: "abort",
        message: messages.join("\n") || "Operation aborted by hook",
      };
    }

    if (shouldSkip) {
      return {
        action: "skip",
        message: messages.join("\n") || "Operation skipped by hook",
      };
    }

    if (currentData !== (context.toolInput ?? context.toolOutput)) {
      return {
        action: "modify",
        data: currentData,
        message: messages.length > 0 ? messages.join("\n") : undefined,
      };
    }

    return {
      action: "continue",
      message: messages.length > 0 ? messages.join("\n") : undefined,
    };
  }

  /**
   * Get a hook by name
   */
  get(name: string): HookDefinition | undefined {
    return this.hooks.get(name);
  }

  /**
   * Enable a hook
   */
  enable(name: string): boolean {
    const hook = this.hooks.get(name);
    if (!hook) return false;

    hook.enabled = true;
    return true;
  }

  /**
   * Disable a hook
   */
  disable(name: string): boolean {
    const hook = this.hooks.get(name);
    if (!hook) return false;

    hook.enabled = false;
    return true;
  }

  /**
   * List all registered hooks
   */
  list(): HookDefinition[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
  }

  /**
   * Get count of registered hooks
   */
  get size(): number {
    return this.hooks.size;
  }
}

/**
 * Global hook registry instance
 */
export const hookRegistry = new HookRegistry();
