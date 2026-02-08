/**
 * /image command - Paste image from clipboard and send to LLM
 *
 * Usage:
 *   /image              — Paste clipboard image with default prompt
 *   /image describe UI  — Paste clipboard image with custom prompt
 */

import chalk from "chalk";
import type { SlashCommand } from "../types.js";
import { readClipboardImage, isClipboardImageAvailable } from "../output/clipboard.js";

/**
 * Shared state: stores pending image data for the next agent turn.
 * This is read and consumed by the REPL main loop after the command executes.
 */
let pendingImage: {
  data: string;
  media_type: string;
  prompt: string;
} | null = null;

/**
 * Get and clear the pending image (consumed by the REPL loop)
 */
export function consumePendingImage(): typeof pendingImage {
  const img = pendingImage;
  pendingImage = null;
  return img;
}

/**
 * Check if there is a pending image
 */
export function hasPendingImage(): boolean {
  return pendingImage !== null;
}

/**
 * Set pending image data directly (used by Ctrl+V keybinding in handler).
 * The REPL loop will consume it via consumePendingImage().
 */
export function setPendingImage(data: string, media_type: string, prompt: string): void {
  pendingImage = { data, media_type, prompt };
}

export const imageCommand: SlashCommand = {
  name: "image",
  aliases: ["img", "paste-image"],
  description: "Paste image from clipboard and send to LLM",
  usage: "/image [prompt]  (e.g. /image describe this UI)",

  async execute(args): Promise<boolean> {
    const available = isClipboardImageAvailable();

    if (!available) {
      console.log(chalk.red("  ✗ Clipboard image reading not available on this platform"));
      console.log(chalk.dim("    macOS: built-in, Linux: requires xclip, Windows: built-in"));
      return false;
    }

    console.log(chalk.dim("  📋 Reading clipboard image…"));

    const imageData = await readClipboardImage();

    if (!imageData) {
      console.log(chalk.yellow("  ⚠ No image found in clipboard"));
      console.log(
        chalk.dim("    Copy an image first (screenshot, browser image, etc.), then use /image"),
      );
      return false;
    }

    // Calculate approximate original image size from base64
    const sizeKB = Math.round((imageData.data.length * 3) / 4 / 1024);

    const prompt =
      args.length > 0
        ? args.join(" ")
        : "Describe this image in detail. If it's code or a UI, identify the key elements.";

    console.log(
      chalk.green("  ✓ Image captured from clipboard") +
        chalk.dim(` (${sizeKB} KB, ${imageData.media_type})`),
    );
    console.log(chalk.dim(`  Prompt: "${prompt}"`));

    // Store the pending image for the REPL loop to consume
    pendingImage = {
      data: imageData.data,
      media_type: imageData.media_type,
      prompt,
    };

    // Return false = don't exit REPL
    // The REPL main loop checks hasPendingImage() after command execution
    return false;
  },
};
