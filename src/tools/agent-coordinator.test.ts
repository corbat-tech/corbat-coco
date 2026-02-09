import { describe, expect, it } from "vitest";
import { AgentTaskQueue, planExecution } from "./agent-coordinator.js";

describe("agent-coordinator", () => {
  describe("AgentTaskQueue", () => {
    it("should add tasks", () => {
      const queue = new AgentTaskQueue();
      const id = queue.addTask({
        description: "Test task",
        priority: "high",
        estimatedDuration: 100,
        dependencies: [],
      });

      expect(id).toBeTruthy();
      expect(queue.getTasks()).toHaveLength(1);
    });

    it("should complete tasks", () => {
      const queue = new AgentTaskQueue();
      const id = queue.addTask({
        description: "Test task",
        priority: "high",
        estimatedDuration: 100,
        dependencies: [],
      });

      queue.completeTask(id, { success: true });
      const task = queue.getTask(id);
      expect(task?.status).toBe("completed");
      expect(task?.result).toEqual({ success: true });
    });

    it("should get ready tasks without dependencies", () => {
      const queue = new AgentTaskQueue();
      queue.addTask({
        description: "Independent task",
        priority: "high",
        estimatedDuration: 100,
        dependencies: [],
      });

      const ready = queue.getReadyTasks();
      expect(ready).toHaveLength(1);
    });
  });

  describe("planExecution", () => {
    it("should plan parallel execution", () => {
      const tasks = [
        { description: "Task 1", dependencies: [] },
        { description: "Task 2", dependencies: [] },
      ];

      const plan = planExecution(tasks, "parallel");
      expect(plan.maxParallelism).toBe(2);
      expect(plan.plan).toHaveLength(2);
    });

    it("should plan sequential execution", () => {
      const tasks = [
        { description: "Task 1", dependencies: [] },
        { description: "Task 2", dependencies: [] },
      ];

      const plan = planExecution(tasks, "sequential");
      expect(plan.maxParallelism).toBe(1);
    });
  });
});
