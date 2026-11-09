import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Les chemins sont calculés depuis ce test, donc ils ne dépendent pas du dossier courant.
const projectDirectory = resolve(__dirname, "..");
const useCasesDirectory = resolve(
  projectDirectory,
  "src",
  "application",
  "usecases"
);
const adaptersDirectory = resolve(projectDirectory, "src", "adapters");

// Parcourt un dossier et ses sous-dossiers pour examiner chaque fichier TypeScript.
function findTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory()
      ? findTypeScriptFiles(entryPath)
      : entry.isFile() && entry.name.endsWith(".ts")
        ? [entryPath]
        : [];
  });
}

describe("Architecture hexagonale", () => {
  it("interdit aux use cases d'importer directement des adapters", () => {
    // Résout les chemins d'import pour repérer les dépendances vers src/adapters.
    const violations = findTypeScriptFiles(useCasesDirectory).flatMap(
      (filePath) => {
        const source = readFileSync(filePath, "utf8");
        const importPaths = Array.from(
          source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g),
          (match) => match[1]
        );

        return importPaths
          .map((importPath) =>
            isAbsolute(importPath)
              ? importPath
              : resolve(dirname(filePath), importPath)
          )
          .filter((resolvedPath) => {
            const pathFromAdapters = relative(adaptersDirectory, resolvedPath);
            return (
              pathFromAdapters === "" ||
              (!pathFromAdapters.startsWith(`..${sep}`) &&
                pathFromAdapters !== ".." &&
                !isAbsolute(pathFromAdapters))
            );
          })
          .map((resolvedPath) => `${filePath} -> ${resolvedPath}`);
      }
    );

    // Aucun use case ne doit dépendre d'un détail technique de persistance ou d'HTTP.
    expect(violations).toEqual([]);
  });
});
