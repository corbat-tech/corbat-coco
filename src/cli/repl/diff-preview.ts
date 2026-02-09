/**
 * Diff Preview System
 *
 * Shows diffs before applying file changes
 */

import chalk from "chalk";
import * as diff from "diff";

/**
 * Generate and format diff preview
 */
export function generateDiffPreview(
  filePath: string,
  oldContent: string,
  newContent: string,
): string {
  const patches = diff.createPatch(filePath, oldContent, newContent, "", "");
  const lines = patches.split("\n");

  const output: string[] = [];
  output.push("");
  output.push(chalk.bold(`📝 Preview changes to ${chalk.cyan(filePath)}`));
  output.push(chalk.gray("─".repeat(60)));

  let addedLines = 0;
  let removedLines = 0;

  for (let i = 4; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.startsWith("+") && !line.startsWith("+++")) {
      output.push(chalk.green(line));
      addedLines++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      output.push(chalk.red(line));
      removedLines++;
    } else if (line.startsWith("@@")) {
      output.push(chalk.cyan(line));
    } else {
      output.push(chalk.gray(line));
    }
  }

  output.push(chalk.gray("─".repeat(60)));
  output.push(
    chalk.dim(`Stats: ${chalk.green(`+${addedLines}`)} ${chalk.red(`-${removedLines}`)}`),
  );
  output.push("");

  return output.join("\n");
}

/**
 * Diff preview configuration
 */
export interface DiffPreviewConfig {
  enabled: boolean;
  autoAcceptThreshold: number; // Auto-accept if diff <= N lines
}

/**
 * Default config
 */
export const defaultDiffPreviewConfig: DiffPreviewConfig = {
  enabled: false, // Disabled by default for now
  autoAcceptThreshold: 10,
};

/**
 * Check if should show preview for this operation
 */
export function shouldShowPreview(config: DiffPreviewConfig, linesChanged: number): boolean {
  if (!config.enabled) return false;
  if (linesChanged <= config.autoAcceptThreshold) return false;
  return true;
}
