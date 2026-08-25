import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Crit 4 ("An instrument"): https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/04-instrument/
// Only the mechanically-checkable lines of the published spec get a test here.
// "expressive", "a stranger can play it uninstructed", "no way to play it
// wrong" are judged live at the crit, not by this suite — see spec/README.md.

const DIST = resolve("dist");

function shippedFiles(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? shippedFiles(path) : [path];
  });
}

// Concatenated text of every shipped file (HTML, inline and bundled JS) —
// stack-agnostic, since a script tag's contents and a bundled .js file both
// land here whichever build tool produced them.
const shipped = shippedFiles()
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("crit 4 spec: an instrument", () => {
  it("makes sound live via the Web Audio API, not by playing back a recording", () => {
    const doc = new JSDOM(readFileSync(join(DIST, "index.html"), "utf8")).window
      .document;

    expect(
      doc.querySelector("audio[src], audio > source, video[src]"),
      "sound is made live by the player, not played back from a pre-recorded file",
    ).toBeFalsy();

    expect(
      /AudioContext/.test(shipped),
      "no reference to (Audio|webkitAudio)Context found in the shipped site — the instrument should synthesise sound with the Web Audio API",
    ).toBe(true);
  });

  it("is playable with more than one input modality", () => {
    // Quote class includes a backtick: the production minifier rewrites string
    // literals as template literals, so `addEventListener("pointerdown"` ships
    // as addEventListener(`pointerdown` and a ["'] class reads a working
    // instrument as having no listeners at all.
    const Q = "[\"'`]";
    const listener = (events: string) =>
      new RegExp(`addEventListener\\(\\s*${Q}(?:${events})${Q}`);

    const modalities: [string, RegExp][] = [
      ["mouse/pointer", listener("click|mouse\\w+|pointer\\w+")],
      ["keyboard", listener("key\\w+")],
      ["touch", listener("touch\\w+")],
    ];
    const present = modalities.filter(([, pattern]) => pattern.test(shipped));

    // Count, not arrayContaining: two expect.any(String) matchers both match
    // the same single element, so arrayContaining passes on one modality —
    // the assertion has to be about how many distinct ones are present. A
    // lower bound, not toHaveLength, since the spec asks for at least two.
    const found = present.map(([name]) => name);

    expect(
      found.length,
      `the spec asks for whatever is at hand — mouse, keyboard, or touch — so at least two input modalities should have listeners in the shipped JS. Found: ${found.join(", ") || "none"}`,
    ).toBeGreaterThanOrEqual(2);
  });
});
