/**
 * Corbat-Coco version - read dynamically from package.json
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findPackageJson(): { version: string } {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    try {
      const content = readFileSync(join(dir, "package.json"), "utf-8");
      const pkg = JSON.parse(content) as { name?: string; version: string };
      if (pkg.name === "@corbat-tech/coco") return pkg;
    } catch {
      // Not found at this level, go up
    }
    dir = dirname(dir);
  }
  return { version: "0.0.0" };
}

export const VERSION: string = findPackageJson().version;
