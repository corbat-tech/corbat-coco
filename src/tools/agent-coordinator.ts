/**
 * Agent Coordinator - Enhanced multi-agent coordination
 * Supports task delegation, parallel execution strategies, and result aggregation
 */

import { z } from "zod";
import { defineTool } from "./registry.js";

/**
 * Agent task with priority and dependencies
 */
export interface AgentTask {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedDuration: number;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

/**
 * Execution strategy for multiple agents
 */
export type ExecutionStrategy = "parallel" | "sequential" | "priority-based" | "pipeline";

/**
 * Task queue for coordinating multiple agents
 */
export class AgentTaskQueue {
  private tasks: Map<string, AgentTask> = new Map();
  private completionOrder: string[] = [];

  addTask(task: Omit<AgentTask, "id" | "status">): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.tasks.set(id, {
      ...task,
      id,
      status: "pending",
    });
    return id;
  }

  getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  getTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  completeTask(id: string, result: unknown): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = "completed";
      task.result = result;
      this.completionOrder.push(id);
    }
  }

  failTask(id: string, error: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = "failed";
      task.error = error;
    }
  }

  getPendingTasks(): AgentTask[] {
    return this.getTasks().filter((t) => t.status === "pending");
  }

  getReadyTasks(): AgentTask[] {
    return this.getPendingTasks().filter((task) => {
      return task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep?.status === "completed";
      });
    });
  }

  getCompletionOrder(): string[] {
    return [...this.completionOrder];
  }
}

/**
 * Plan multi-agent execution
 */
export function planExecution(
  tasks: Array<{ description: string; dependencies?: string[] }>,
  strategy: ExecutionStrategy,
): {
  plan: string[];
  estimatedTime: number;
  maxParallelism: number;
} {
  const taskGraph = new Map<string, string[]>();

  // Build dependency graph
  tasks.forEach((task, idx) => {
    const id = `task-${idx}`;
    taskGraph.set(id, task.dependencies || []);
  });

  let plan: string[] = [];
  let estimatedTime = 0;
  let maxParallelism = 1;

  switch (strategy) {
    case "parallel": {
      // All independent tasks run in parallel
      plan = Array.from(taskGraph.keys());
      estimatedTime = 100; // Assume 100ms per task
      maxParallelism = tasks.length;
      break;
    }

    case "sequential": {
      // Tasks run one after another
      plan = Array.from(taskGraph.keys());
      estimatedTime = tasks.length * 100;
      maxParallelism = 1;
      break;
    }

    case "priority-based": {
      // Sort by implied priority (shorter descriptions = simpler)
      const sorted = tasks
        .map((t, idx) => ({ id: `task-${idx}`, len: t.description.length }))
        .sort((a, b) => a.len - b.len);
      plan = sorted.map((t) => t.id);
      estimatedTime = tasks.length * 80;
      maxParallelism = 3;
      break;
    }

    case "pipeline": {
      // Topological sort for pipeline execution
      const visited = new Set<string>();
      const temp = new Set<string>();

      function visit(id: string) {
        if (temp.has(id)) throw new Error("Circular dependency");
        if (visited.has(id)) return;

        temp.add(id);
        const deps = taskGraph.get(id) || [];
        for (const dep of deps) {
          visit(dep);
        }
        temp.delete(id);
        visited.add(id);
        plan.push(id);
      }

      for (const id of taskGraph.keys()) {
        if (!visited.has(id)) visit(id);
      }

      estimatedTime = plan.length * 90;
      maxParallelism = 2;
      break;
    }
  }

  return { plan, estimatedTime, maxParallelism };
}

/**
 * Tool: Create agent coordination plan
 */
export const createAgentPlanTool = defineTool({
  name: "createAgentPlan",
  description: "Create an execution plan for coordinating multiple sub-agents",
  category: "build" as const,
  parameters: z.object({
    tasks: z.array(
      z.object({
        description: z.string(),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        dependencies: z.array(z.string()).default([]),
      }),
    ),
    strategy: z.enum(["parallel", "sequential", "priority-based", "pipeline"]).default("parallel"),
  }),

  async execute(input) {
    const typedInput = input as {
      tasks: Array<{
        description: string;
        priority: "high" | "medium" | "low";
        dependencies: string[];
      }>;
      strategy: ExecutionStrategy;
    };

    const queue = new AgentTaskQueue();
    const taskIds: string[] = [];

    // Add all tasks to queue
    for (const task of typedInput.tasks) {
      const id = queue.addTask({
        description: task.description,
        priority: task.priority,
        estimatedDuration: 100,
        dependencies: task.dependencies,
      });
      taskIds.push(id);
    }

    // Plan execution
    const executionPlan = planExecution(typedInput.tasks, typedInput.strategy);

    return {
      planId: `plan-${Date.now()}`,
      strategy: typedInput.strategy,
      totalTasks: typedInput.tasks.length,
      executionOrder: executionPlan.plan,
      estimatedTime: executionPlan.estimatedTime,
      maxParallelism: executionPlan.maxParallelism,
      tasks: queue.getTasks().map((t) => ({
        id: t.id,
        description: t.description,
        priority: t.priority,
        dependencies: t.dependencies,
        status: t.status,
      })),
    };
  },
});

/**
 * Tool: Delegate task to virtual sub-agent
 */
export const delegateTaskTool = defineTool({
  name: "delegateTask",
  description: "Delegate a task to a virtual sub-agent (simulated for demonstration)",
  category: "build" as const,
  parameters: z.object({
    taskId: z.string(),
    agentRole: z.enum(["researcher", "coder", "reviewer", "tester", "optimizer"]).default("coder"),
    context: z.string().optional(),
  }),

  async execute(input) {
    const typedInput = input as {
      taskId: string;
      agentRole: string;
      context?: string;
    };

    const agentId = `agent-${Date.now()}-${typedInput.agentRole}`;

    return {
      agentId,
      taskId: typedInput.taskId,
      role: typedInput.agentRole,
      status: "simulated",
      message: `Task delegated to ${typedInput.agentRole} agent`,
      capabilities: {
        researcher: ["web search", "document analysis", "information synthesis"],
        coder: ["code generation", "refactoring", "debugging"],
        reviewer: ["code review", "security analysis", "best practices"],
        tester: ["test generation", "coverage analysis", "bug detection"],
        optimizer: ["performance tuning", "complexity reduction", "resource optimization"],
      }[typedInput.agentRole],
      note: "This is a simulated agent. Full implementation requires provider integration.",
    };
  },
});

/**
 * Tool: Aggregate results from multiple agents
 */
export const aggregateResultsTool = defineTool({
  name: "aggregateResults",
  description: "Aggregate and summarize results from multiple sub-agents",
  category: "build" as const,
  parameters: z.object({
    results: z.array(
      z.object({
        agentId: z.string(),
        taskId: z.string(),
        status: z.enum(["completed", "failed"]),
        output: z.string(),
      }),
    ),
    aggregationStrategy: z.enum(["merge", "vote", "best", "summary"]).default("merge"),
  }),

  async execute(input) {
    const typedInput = input as {
      results: Array<{
        agentId: string;
        taskId: string;
        status: "completed" | "failed";
        output: string;
      }>;
      aggregationStrategy: string;
    };

    const completed = typedInput.results.filter((r) => r.status === "completed");
    const failed = typedInput.results.filter((r) => r.status === "failed");

    let aggregatedOutput = "";

    switch (typedInput.aggregationStrategy) {
      case "merge":
        aggregatedOutput = completed.map((r) => r.output).join("\n\n---\n\n");
        break;

      case "vote":
        // Simple voting: most common output wins
        const counts = new Map<string, number>();
        for (const r of completed) {
          counts.set(r.output, (counts.get(r.output) || 0) + 1);
        }
        const winner = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        aggregatedOutput = winner ? winner[0] : "";
        break;

      case "best":
        // Return longest output as "best" (simple heuristic)
        const longest = completed.sort((a, b) => b.output.length - a.output.length)[0];
        aggregatedOutput = longest ? longest.output : "";
        break;

      case "summary":
        aggregatedOutput = `Completed: ${completed.length}, Failed: ${failed.length}\n\n${completed.map((r) => `- ${r.agentId}: Success`).join("\n")}`;
        break;
    }

    return {
      totalResults: typedInput.results.length,
      completedCount: completed.length,
      failedCount: failed.length,
      strategy: typedInput.aggregationStrategy,
      aggregatedOutput,
      individualResults: typedInput.results.map((r) => ({
        agentId: r.agentId,
        taskId: r.taskId,
        status: r.status,
      })),
    };
  },
});

export const agentCoordinatorTools = [createAgentPlanTool, delegateTaskTool, aggregateResultsTool];
