/**
 * Tool Recommender System
 * Intelligent tool selection based on task analysis
 */

import { ToolDefinition, ToolCategory } from "./registry.js";

export interface ToolRecommendation {
  tool: ToolDefinition;
  score: number;
  reason: string;
}

export interface TaskAnalysis {
  intent: TaskIntent;
  keywords: string[];
  context: string[];
  requiredCapabilities: string[];
}

export type TaskIntent =
  | "read_file"
  | "write_file"
  | "edit_file"
  | "search_code"
  | "analyze_code"
  | "run_tests"
  | "commit_changes"
  | "fix_bug"
  | "refactor"
  | "optimize"
  | "generate_code"
  | "review_code"
  | "explain_code"
  | "debug"
  | "deploy"
  | "configure"
  | "install"
  | "unknown";

/**
 * Intent patterns for common tasks
 */
const INTENT_PATTERNS: Record<TaskIntent, RegExp[]> = {
  read_file: [/read|show|display|view|open|cat|see/i, /file|content/i],
  write_file: [/write|create|make|generate|new/i, /file/i],
  edit_file: [/edit|modify|change|update|fix|patch/i, /file|code/i],
  search_code: [/search|find|locate|grep|look\s+for/i, /code|function|class|variable/i],
  analyze_code: [/analyze|examine|inspect|check|review|audit/i, /code|quality|complexity/i],
  run_tests: [/test|run|execute|check/i, /test|spec|suite/i],
  commit_changes: [/commit|save|checkin|stage/i, /git|changes|code/i],
  fix_bug: [/fix|resolve|repair|debug/i, /bug|error|issue|problem/i],
  refactor: [/refactor|restructure|reorganize|clean/i, /code/i],
  optimize: [/optimize|improve|speed|performance|faster/i],
  generate_code: [/generate|create|write|implement/i, /function|class|component|code/i],
  review_code: [/review|check|validate|verify/i, /code|pr|pull\s+request/i],
  explain_code: [/explain|describe|what\s+does|how\s+does/i, /code|function|class/i],
  debug: [/debug|trace|diagnose|troubleshoot/i],
  deploy: [/deploy|release|publish|ship/i],
  configure: [/configure|setup|config|settings/i],
  install: [/install|add|setup/i, /package|dependency|library/i],
  unknown: [],
};

/**
 * Tool capabilities mapping
 */
const TOOL_CAPABILITIES: Record<string, string[]> = {
  // File tools
  readFile: ["read", "view", "content", "file"],
  writeFile: ["write", "create", "file"],
  editFile: ["edit", "modify", "change", "file"],

  // Search tools
  searchFiles: ["search", "find", "locate", "file"],
  grepCode: ["search", "find", "grep", "code"],

  // Code analysis
  analyzeFile: ["analyze", "inspect", "code", "structure"],
  validateCode: ["validate", "check", "syntax", "ast"],
  suggestImprovements: ["improve", "suggest", "quality", "refactor"],
  calculateCodeScore: ["score", "quality", "metrics"],

  // Git tools
  gitCommit: ["commit", "save", "git"],
  simpleAutoCommit: ["commit", "auto", "git"],
  analyzeRepoHealth: ["analyze", "git", "health", "repository"],
  recommendBranch: ["branch", "git", "recommend"],

  // Testing
  runTests: ["test", "run", "execute"],

  // Multi-agent
  spawnSimpleAgent: ["delegate", "agent", "subtask"],
  createAgentPlan: ["plan", "coordinate", "multi-agent"],

  // Context
  addContext: ["remember", "context", "memory"],
  getRelevantContext: ["recall", "context", "retrieve"],
};

/**
 * Category weights for different intents
 */
const CATEGORY_WEIGHTS: Record<TaskIntent, Partial<Record<ToolCategory, number>>> = {
  read_file: { file: 1.0, search: 0.5 },
  write_file: { file: 1.0 },
  edit_file: { file: 1.0, quality: 0.3 },
  search_code: { search: 1.0, file: 0.5 },
  analyze_code: { quality: 1.0, search: 0.5 },
  run_tests: { test: 1.0 },
  commit_changes: { git: 1.0 },
  fix_bug: { quality: 0.8, file: 0.6, test: 0.5 },
  refactor: { quality: 1.0, file: 0.7 },
  optimize: { quality: 1.0, build: 0.5 },
  generate_code: { file: 1.0, quality: 0.5 },
  review_code: { quality: 1.0 },
  explain_code: { quality: 0.8, search: 0.6 },
  debug: { quality: 0.8, test: 0.6 },
  deploy: { deploy: 1.0, build: 0.7 },
  configure: { config: 1.0 },
  install: { build: 1.0 },
  unknown: {},
};

/**
 * Analyze task to determine intent
 */
export function analyzeTask(userMessage: string): TaskAnalysis {
  const messageLower = userMessage.toLowerCase();
  let bestIntent: TaskIntent = "unknown";
  let maxMatches = 0;

  // Try to match intent patterns
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [TaskIntent, RegExp[]][]) {
    let matches = 0;
    for (const pattern of patterns) {
      if (pattern.test(messageLower)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestIntent = intent;
    }
  }

  // Extract keywords
  const keywords = messageLower
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 10);

  // Extract file paths and code references
  const context: string[] = [];
  const filePathMatch = userMessage.match(/[a-z0-9_/-]+\.(ts|js|tsx|jsx|py|go|rs|java)/gi);
  if (filePathMatch) {
    context.push(...filePathMatch);
  }

  // Determine required capabilities
  const requiredCapabilities: string[] = [];
  if (messageLower.includes("file")) requiredCapabilities.push("file");
  if (messageLower.includes("test")) requiredCapabilities.push("test");
  if (messageLower.includes("git") || messageLower.includes("commit"))
    requiredCapabilities.push("git");
  if (messageLower.includes("analyze") || messageLower.includes("check"))
    requiredCapabilities.push("quality");

  return {
    intent: bestIntent,
    keywords,
    context,
    requiredCapabilities,
  };
}

/**
 * Recommend tools for a given task
 */
export function recommendTools(
  userMessage: string,
  availableTools: ToolDefinition[],
  limit = 5,
): ToolRecommendation[] {
  const analysis = analyzeTask(userMessage);
  const recommendations: ToolRecommendation[] = [];

  for (const tool of availableTools) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Category matching (weight 40%)
    const categoryWeight = CATEGORY_WEIGHTS[analysis.intent]?.[tool.category] || 0;
    if (categoryWeight > 0) {
      score += categoryWeight * 40;
      reasons.push(`Category match (${tool.category})`);
    }

    // 2. Capability matching (weight 30%)
    const toolCapabilities = TOOL_CAPABILITIES[tool.name] || [];
    let capabilityMatches = 0;
    for (const required of analysis.requiredCapabilities) {
      if (toolCapabilities.some((cap) => cap.includes(required))) {
        capabilityMatches++;
      }
    }
    if (capabilityMatches > 0 && analysis.requiredCapabilities.length > 0) {
      const capScore = (capabilityMatches / analysis.requiredCapabilities.length) * 30;
      score += capScore;
      reasons.push(`${capabilityMatches} capability matches`);
    }

    // 3. Keyword matching in description (weight 20%)
    const descriptionLower = tool.description.toLowerCase();
    let keywordMatches = 0;
    for (const keyword of analysis.keywords) {
      if (descriptionLower.includes(keyword)) {
        keywordMatches++;
      }
    }
    if (keywordMatches > 0) {
      const keywordScore = Math.min(20, (keywordMatches / analysis.keywords.length) * 20);
      score += keywordScore;
      reasons.push(`${keywordMatches} keyword matches`);
    }

    // 4. Context matching (weight 10%)
    for (const ctx of analysis.context) {
      if (descriptionLower.includes(ctx.toLowerCase())) {
        score += 10;
        reasons.push("Context match");
        break;
      }
    }

    // Only include tools with meaningful scores
    if (score > 10) {
      recommendations.push({
        tool,
        score,
        reason: reasons.join(", "),
      });
    }
  }

  // Sort by score and return top N
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

/**
 * Get tool recommendation summary
 */
export function getRecommendationSummary(
  userMessage: string,
  availableTools: ToolDefinition[],
): string {
  const analysis = analyzeTask(userMessage);
  const recommendations = recommendTools(userMessage, availableTools, 3);

  const lines: string[] = [];
  lines.push(`Task Analysis:`);
  lines.push(`  Intent: ${analysis.intent}`);
  lines.push(`  Required: ${analysis.requiredCapabilities.join(", ") || "none"}`);
  lines.push(``);
  lines.push(`Recommended Tools (top 3):`);

  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    if (!rec) continue;
    lines.push(`  ${i + 1}. ${rec.tool.name} (score: ${rec.score.toFixed(1)})`);
    lines.push(`     ${rec.tool.description}`);
    lines.push(`     Reason: ${rec.reason}`);
  }

  return lines.join("\n");
}
