/**
 * ESM loader to resolve @/ alias during tests.
 * Usage: node --loader ./tests/resolve-alias.mjs tests/tutor-engine-test.mjs
 */
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const ROOT_SRC = resolvePath(fileURLToPath(new URL("..", import.meta.url)), "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = pathToFileURL(resolvePath(ROOT_SRC, specifier.slice(2))).href;
    return { shortCircuit: true, url };
  }
  return nextResolve(specifier);
}
