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
    const modalities: [string, RegExp][] = [
      ["mouse/pointer", /addEventListener\(\s*["'](?:click|mouse\w+|pointer\w+)["']/],
      ["keyboard", /addEventListener\(\s*["']key\w+["']/],
      ["touch", /addEventListener\(\s*["']touch\w+["']/],
    ];
    const present = modalities.filter(([, pattern]) => pattern.test(shipped));

    expect(
      present.map(([name]) => name),
      "the spec asks for whatever is at hand — mouse, keyboard, or touch — so at least two input modalities should have listeners in the shipped JS",
    ).toEqual(expect.arrayContaining([expect.any(String), expect.any(String)]));
  });
});
