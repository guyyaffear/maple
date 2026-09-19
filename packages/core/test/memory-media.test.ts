import { describe, expect, it } from "vitest";

import { capabilitiesOf, missingRequirements } from "../src/connectors/capabilities.js";
import { memoryMedia } from "../src/testing/memory-media.js";

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function blob(data = PNG) {
  return { data, contentType: "image/png" };
}

describe("the in-memory media connector", () => {
  it("is usable as one, by the same check every connector passes", () => {
    expect(missingRequirements("media", memoryMedia())).toEqual([]);
    expect(capabilitiesOf("media", memoryMedia())).toEqual({
      putBlob: true,
      getUrl: true,
      remove: true,
    });
  });

  it("hands back a reference carrying its own name and the type it was given", async () => {
    const ref = await memoryMedia().putBlob(blob());

    expect(ref).toMatchObject({ connector: "memory", contentType: "image/png" });
    expect(ref.key).not.toHaveLength(0);
  });

  it("keeps the bytes exactly, which is the whole job", async () => {
    const media = memoryMedia();
    const url = await media.getUrl(await media.putBlob(blob()));
    const encoded = url.slice(url.indexOf(",") + 1);

    expect(Uint8Array.from(atob(encoded), (one) => one.charCodeAt(0))).toEqual(PNG);
  });

  it("gives each blob its own key rather than overwriting the last", async () => {
    const media = memoryMedia();
    const first = await media.putBlob(blob());
    const second = await media.putBlob(blob(new Uint8Array([1, 2])));

    expect(first.key).not.toBe(second.key);
  });

  it("refuses a key it never gave, rather than answering with nothing", async () => {
    const media = memoryMedia();

    await expect(
      media.getUrl({ connector: "memory", key: "never", contentType: "image/png" }),
    ).rejects.toThrow(RangeError);
  });

  it("forgets one that is removed", async () => {
    const media = memoryMedia();
    const ref = await media.putBlob(blob());
    await media.remove?.(ref);

    await expect(media.getUrl(ref)).rejects.toThrow(RangeError);
  });

  it("answers to whatever name it was given, so two can be told apart", async () => {
    const ref = await memoryMedia({ name: "shots" }).putBlob(blob());

    expect(ref.connector).toBe("shots");
  });
});
