/**
 * Skill Enhancement Tool
 * Dynamic skill loading and custom tool creation
 */

import { defineTool } from "./registry.js";
import { z } from "zod";

const fs = await import("node:fs/promises");
const path = await import("node:path");

export interface SkillDefinition {
  name: string;
  description: string;
  category: string;
  handler: string; // Function body as string
  parameters: Record<string, unknown>;
}

/**
 * Discover available skills in directory
 */
export async function discoverSkills(skillsDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(skillsDir);
    return files.filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
  } catch {
    return [];
  }
}

/**
 * Load skill metadata
 */
export async function loadSkillMetadata(skillPath: string): Promise<{
  name: string;
  description: string;
  version: string;
  dependencies: string[];
}> {
  try {
    const content = await fs.readFile(skillPath, "utf-8");

    // Extract metadata from JSDoc comments
    const nameMatch = content.match(/@name\s+(\S+)/);
    const descMatch = content.match(/@description\s+(.+)/);
    const versionMatch = content.match(/@version\s+(\S+)/);

    return {
      name: nameMatch?.[1] || path.basename(skillPath, path.extname(skillPath)),
      description: descMatch?.[1] || "No description",
      version: versionMatch?.[1] || "1.0.0",
      dependencies: [],
    };
  } catch {
    return {
      name: "unknown",
      description: "Failed to load",
      version: "0.0.0",
      dependencies: [],
    };
  }
}

/**
 * Validate skill structure
 */
export function validateSkill(skill: Partial<SkillDefinition>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!skill.name || skill.name.trim() === "") {
    errors.push("Skill name is required");
  }

  if (!skill.description || skill.description.trim() === "") {
    errors.push("Skill description is required");
  }

  if (!skill.category || skill.category.trim() === "") {
    errors.push("Skill category is required");
  }

  if (!skill.handler || skill.handler.trim() === "") {
    errors.push("Skill handler is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Tool: Discover available skills
 */
export const discoverSkillsTool = defineTool({
  name: "discoverSkills",
  description: "Discover available skills in the skills directory",
  category: "build" as const,
  parameters: z.object({
    skillsDir: z.string().default(".coco/skills"),
  }),

  async execute(input) {
    const { skillsDir } = input as { skillsDir: string };
    const skills = await discoverSkills(skillsDir);

    const metadata = await Promise.all(
      skills.map((s) => loadSkillMetadata(path.join(skillsDir, s))),
    );

    return {
      skillsDir,
      totalSkills: skills.length,
      skills: metadata,
    };
  },
});

/**
 * Tool: Validate skill definition
 */
export const validateSkillTool = defineTool({
  name: "validateSkill",
  description: "Validate a skill definition before loading",
  category: "build" as const,
  parameters: z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
    handler: z.string(),
  }),

  async execute(input) {
    const validation = validateSkill(input as Partial<SkillDefinition>);

    return {
      valid: validation.valid,
      errors: validation.errors,
      message: validation.valid ? "Skill definition is valid" : "Skill has validation errors",
    };
  },
});

/**
 * Tool: Create custom tool from template
 */
export const createCustomToolTool = defineTool({
  name: "createCustomTool",
  description: "Create a custom tool from a template",
  category: "build" as const,
  parameters: z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(["file", "bash", "git", "quality", "build"]),
    template: z.enum(["simple", "async", "with-validation"]).default("simple"),
  }),

  async execute(input) {
    const typedInput = input as {
      name: string;
      description: string;
      category: string;
      template: string;
    };

    const templates = {
      simple: `
/**
 * ${typedInput.description}
 */
export const ${typedInput.name}Tool = defineTool({
  name: "${typedInput.name}",
  description: "${typedInput.description}",
  category: "${typedInput.category}" as const,
  parameters: z.object({
    // Add your parameters here
  }),

  async execute(input) {
    // Implement your tool logic here
    return { success: true, message: "Tool executed" };
  }
});
`,
      async: `
/**
 * ${typedInput.description}
 */
export const ${typedInput.name}Tool = defineTool({
  name: "${typedInput.name}",
  description: "${typedInput.description}",
  category: "${typedInput.category}" as const,
  parameters: z.object({
    // Add your parameters here
  }),

  async execute(input) {
    try {
      // Implement your async tool logic here
      const result = await someAsyncOperation(input);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});
`,
      "with-validation": `
/**
 * ${typedInput.description}
 */

// Input validation schema
const ${typedInput.name}Schema = z.object({
  // Define your input schema here
});

export const ${typedInput.name}Tool = defineTool({
  name: "${typedInput.name}",
  description: "${typedInput.description}",
  category: "${typedInput.category}" as const,
  parameters: ${typedInput.name}Schema,

  async execute(input) {
    const validated = ${typedInput.name}Schema.parse(input);

    // Implement your tool logic with validated input
    return { success: true, data: validated };
  }
});
`,
    };

    const code = templates[typedInput.template as keyof typeof templates] || templates.simple;

    return {
      name: typedInput.name,
      template: typedInput.template,
      code,
      instructions: [
        "1. Review the generated code",
        "2. Add your custom logic",
        "3. Add input parameters to the schema",
        "4. Export the tool from your module",
        "5. Register in tool registry",
      ],
    };
  },
});

export const skillEnhancerTools = [discoverSkillsTool, validateSkillTool, createCustomToolTool];
