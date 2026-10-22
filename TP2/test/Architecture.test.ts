import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Les chemins partent de ce fichier pour que le test fonctionne quel que soit le dossier courant.
const projectDirectory = resolve(__dirname, "..");
const useCasesDirectory = resolve(projectDirectory, "src", "application", "usecases");
const adaptersDirectory = resolve(projectDirectory, "src", "adapters");

// Récupère les fichiers TypeScript d'un dossier, y compris ceux de ses sous-dossiers.
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
  it("interdit aux cas d'utilisation d'importer directement des adapters", () => {
    // Examine chaque import pour vérifier qu'il ne pointe pas vers le dossier des adapters.
    const violations = findTypeScriptFiles(useCasesDirectory).flatMap((filePath) => {
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
    });

    // Le tableau doit rester vide pour préserver l'indépendance des use cases.
    expect(violations).toEqual([]);
  });
});
