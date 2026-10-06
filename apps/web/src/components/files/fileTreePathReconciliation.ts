import type { FileTreeBatchOperation } from "@pierre/trees";

function pathDepth(path: string): number {
  return path.split("/").filter(Boolean).length;
}

/** Every directory, with its trailing slash, that holds one of `paths`. */
function ancestorDirectories(paths: readonly string[]): Set<string> {
  const ancestors = new Set<string>();
  for (const path of paths) {
    for (let index = path.indexOf("/"); index !== -1; index = path.indexOf("/", index + 1)) {
      if (index < path.length - 1) ancestors.add(path.slice(0, index + 1));
    }
  }
  return ancestors;
}

export function buildFileTreePathUpdates(
  previousPaths: readonly string[],
  nextPaths: readonly string[],
): FileTreeBatchOperation[] {
  const previous = new Set(previousPaths);
  const next = new Set(nextPaths);
  const removedDirectoryRoots: string[] = [];
  const updates: FileTreeBatchOperation[] = [];

  const removedPaths = previousPaths
    .filter((path) => !next.has(path))
    .toSorted((left, right) => pathDepth(left) - pathDepth(right));
  // A directory can leave the list while paths below it stay, as when a search
  // listed a row that only groups roots. The tree still needs it for them, and
  // removing it would take them along.
  let nextAncestors: Set<string> | undefined;
  for (const path of removedPaths) {
    if (removedDirectoryRoots.some((directory) => path.startsWith(directory))) continue;
    const recursive = path.endsWith("/");
    if (recursive) {
      nextAncestors ??= ancestorDirectories(nextPaths);
      if (nextAncestors.has(path)) continue;
    }
    updates.push({ type: "remove", path, ...(recursive ? { recursive: true } : {}) });
    if (recursive) removedDirectoryRoots.push(path);
  }

  const addedPaths = nextPaths
    .filter((path) => !previous.has(path))
    .toSorted((left, right) => pathDepth(left) - pathDepth(right));
  for (const path of addedPaths) updates.push({ type: "add", path });

  return updates;
}
