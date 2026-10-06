import { describe, expect, it } from "vite-plus/test";

import { buildFileTreePathUpdates } from "./fileTreePathReconciliation";

describe("buildFileTreePathUpdates", () => {
  it("updates only paths that changed", () => {
    expect(
      buildFileTreePathUpdates(
        ["src/", "src/kept.ts", "src/removed.ts"],
        ["src/", "src/kept.ts", "src/added.ts"],
      ),
    ).toEqual([
      { type: "remove", path: "src/removed.ts" },
      { type: "add", path: "src/added.ts" },
    ]);
  });

  it("removes a missing subtree with one recursive update", () => {
    expect(
      buildFileTreePathUpdates(
        ["src/", "src/feature/", "src/feature/index.ts", "src/kept.ts"],
        ["src/", "src/kept.ts"],
      ),
    ).toEqual([{ type: "remove", path: "src/feature/", recursive: true }]);
  });

  it("keeps a directory that leaves the list while paths below it stay", () => {
    // Clearing a search drops the `dupe-a/` row it listed for two roots whose
    // labels grew a parent segment; the roots themselves are still listed.
    expect(
      buildFileTreePathUpdates(
        ["dupe-a/", "dupe-a/docs/", "dupe-a/docs/guide.md", "dupe-a/notes/", "dupe-b/docs/"],
        ["dupe-a/docs/", "dupe-a/notes/", "dupe-b/docs/"],
      ),
    ).toEqual([{ type: "remove", path: "dupe-a/docs/guide.md" }]);
  });

  it("does nothing when a refresh returns the same tree", () => {
    const paths = ["src/", "src/index.ts"];
    expect(buildFileTreePathUpdates(paths, [...paths])).toEqual([]);
  });
});
