import { describe, expect, it } from "vitest";

import { MAPLE_LOADER, MapleConfigError, TAGGED_FILES, withMaple } from "../src/next/index.js";

interface Rules {
  readonly [glob: string]: { loaders?: { loader: string; options?: { root?: string } }[] };
}

function rulesOf(config: Record<string, unknown>): Rules {
  return (config["turbopack"] as { rules?: Rules } | undefined)?.rules ?? {};
}

function stripping(config: Record<string, unknown>): unknown {
  return (config["compiler"] as { reactRemoveProperties?: unknown }).reactRemoveProperties;
}

describe("a preview build", () => {
  const built: Record<string, unknown> = withMaple({}, { preview: true, root: "/repo/app" });

  it("tags every tsx by filename, because a path glob never matches", () => {
    expect(Object.keys(rulesOf(built))).toEqual([TAGGED_FILES]);
    expect(TAGGED_FILES).not.toContain("/");
  });

  it("points the rule at the loader, with the root paths are relative to", () => {
    expect(rulesOf(built)[TAGGED_FILES]?.loaders).toEqual([
      { loader: MAPLE_LOADER, options: { root: "/repo/app" } },
    ]);
  });

  it("does not strip what it just added, which is the whole failure", () => {
    expect(stripping(built)).toBe(false);
  });

  it("tags under webpack too, so the escape hatch is not a silent downgrade", () => {
    const module: { rules: unknown[] } = { rules: [] };
    const hook = built["webpack"] as (
      config: unknown,
      context: unknown,
    ) => {
      module: typeof module;
    };

    expect(hook({ module }, {}).module.rules).toHaveLength(1);
  });

  it("runs the application's own webpack hook first, and keeps what it did", () => {
    const own = withMaple(
      { webpack: () => ({ module: { rules: ["theirs"] } }) },
      { preview: true },
    );
    const hook = own.webpack as (
      config: unknown,
      context: unknown,
    ) => { module: { rules: unknown[] } };

    expect(hook({ module: { rules: [] } }, {}).module.rules[0]).toBe("theirs");
  });

  it("keeps rules the application already had", () => {
    const own = withMaple({ turbopack: { rules: { "*.svg": {} } } }, { preview: true });

    expect(Object.keys(rulesOf(own)).sort((a, b) => a.localeCompare(b))).toEqual([
      "*.svg",
      TAGGED_FILES,
    ]);
  });
});

describe("every other build", () => {
  const built: Record<string, unknown> = withMaple({}, { preview: false });

  it("adds no rule, so nothing is tagged", () => {
    expect(rulesOf(built)).toEqual({});
  });

  it("strips the attributes by pattern", () => {
    expect(stripping(built)).toEqual({ properties: ["^data-maple-"] });
  });

  it("strips whatever else the application asked for, after Maple's own", () => {
    const own = withMaple({}, { preview: false, removeProperties: ["^data-test"] });

    expect(stripping(own)).toEqual({ properties: ["^data-maple-", "^data-test"] });
  });

  it("leaves a webpack hook it has nothing to add to alone", () => {
    const hook = () => ({});
    expect(withMaple({ webpack: hook }, { preview: false }).webpack).toBe(hook);
  });
});

describe("a config that already owns the stripping", () => {
  it("refuses rather than merging, because two owners is the bug", () => {
    const already = { compiler: { reactRemoveProperties: { properties: ["^data-test"] } } };

    expect(() => withMaple(already, { preview: true })).toThrow(MapleConfigError);
  });

  it("says where to put the patterns instead", () => {
    const already = { compiler: { reactRemoveProperties: false } };

    expect(() => withMaple(already, { preview: false })).toThrow(/removeProperties/);
  });

  it("keeps every other compiler option the application set", () => {
    const built = withMaple({ compiler: { removeConsole: true } }, { preview: true });

    expect((built.compiler as { removeConsole?: boolean }).removeConsole).toBe(true);
  });
});
