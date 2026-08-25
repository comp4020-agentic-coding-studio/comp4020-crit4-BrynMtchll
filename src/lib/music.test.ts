import { describe, expect, it } from "vitest";
import {
  CHORDS,
  GROOVES,
  IN_KEY,
  PERCUSSION,
  PERC_BANDS,
  PRESETS,
  PROGRESSIONS,
  SUBDIVS,
  VOICES,
  VOWELS,
  bandForDrumMidi,
  byId,
  semitoneOf,
  swingOffset,
  voiceOffsets,
} from "./music";

// The instrument promises that there is no way to play it wrong. That promise
// lives in this data, not in the synthesis, so it is checked here rather than
// trusted — I cannot hear whether a chord is in key, but I can prove it.

const pitchClass = (semitone: number) => ((semitone % 12) + 12) % 12;

describe("every chord stays in A natural minor", () => {
  for (const [id, chord] of Object.entries(CHORDS)) {
    it(`${id} is diatonic`, () => {
      const strays = chord.tones.filter((t) => !IN_KEY.includes(pitchClass(t)));
      expect(
        strays,
        `${id} leaves the key on ${strays.join(", ")} — a mark drawn against it could sound wrong`,
      ).toEqual([]);
    });
  }

  it("chords ascend, so bands climb through them", () => {
    for (const [id, chord] of Object.entries(CHORDS)) {
      const sorted = [...chord.tones].sort((a, b) => a - b);
      expect(chord.tones, `${id} is out of order`).toEqual(sorted);
    }
  });
});

describe("progressions", () => {
  it("each fills exactly the four bars of the loop", () => {
    for (const progression of PROGRESSIONS) {
      expect(progression.bars, progression.id).toHaveLength(4);
    }
  });

  it("have unique ids", () => {
    const ids = PROGRESSIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("band layout", () => {
  it("climbs without ever repeating a pitch", () => {
    for (const progression of PROGRESSIONS) {
      for (const chord of progression.bars) {
        let previous = -Infinity;
        for (let band = 0; band < 16; band++) {
          const semitone = semitoneOf(band, chord.tones);
          expect(
            semitone,
            `${chord.name} band ${band} does not rise above the one below it`,
          ).toBeGreaterThan(previous);
          previous = semitone;
        }
      }
    }
  });

  it("voicing a mark against a chord builds that chord", () => {
    const [first, second] = voiceOffsets(true);
    for (const chord of Object.values(CHORDS)) {
      const voiced = [0, first, second].map((o) =>
        pitchClass(semitoneOf(o, chord.tones)),
      );
      // Every note the voicing adds has to be a tone of the chord it voices.
      for (const note of voiced) {
        expect(
          chord.tones.map(pitchClass),
          `${chord.name} voiced onto a note outside itself`,
        ).toContain(note);
      }
      expect(new Set(voiced).size, `${chord.name} voicing is not three notes`).toBe(3);
    }
  });

  it("voicing against a scale takes a third and a fifth", () => {
    expect(voiceOffsets(false)).toEqual([2, 4]);
  });
});

describe("grooves", () => {
  for (const groove of GROOVES) {
    it(`${groove.id} lands inside the loop`, () => {
      for (const hit of groove.hits) {
        expect(hit.sub, `${groove.id} hit past the end of the loop`)
          .toBeGreaterThanOrEqual(0);
        expect(hit.sub).toBeLessThan(SUBDIVS);
        expect(hit.band, `${groove.id} hit outside the drum bands`)
          .toBeGreaterThanOrEqual(0);
        expect(hit.band).toBeLessThan(PERC_BANDS);
        expect(hit.level).toBeGreaterThan(0);
        expect(hit.level).toBeLessThanOrEqual(1);
      }
    });
  }

  it("never stacks two hits on the same drum at the same moment", () => {
    for (const groove of GROOVES) {
      const seen = new Set<string>();
      for (const hit of groove.hits) {
        const key = `${hit.band}:${hit.sub}`;
        expect(seen.has(key), `${groove.id} doubles up on ${key}`).toBe(false);
        seen.add(key);
      }
    }
  });
});

describe("presets", () => {
  it("only name things that exist", () => {
    for (const preset of PRESETS) {
      expect(byId(VOICES, preset.voice).id, preset.id).toBe(preset.voice);
      expect(byId(PROGRESSIONS, preset.progression).id, preset.id).toBe(
        preset.progression,
      );
      expect(byId(GROOVES, preset.groove).id, preset.id).toBe(preset.groove);
      expect(byId(VOICES, preset.bass).id, preset.id).toBe(preset.bass);
      expect(byId(VOWELS, preset.vowel).id, preset.id).toBe(preset.vowel);
    }
  });

  it("stay within audible, non-painful ranges", () => {
    for (const preset of PRESETS) {
      expect(preset.cutoff, preset.id).toBeGreaterThanOrEqual(400);
      expect(preset.cutoff, preset.id).toBeLessThanOrEqual(12000);
      // Resonance high enough to self-oscillate would scream on its own.
      expect(preset.resonance, preset.id).toBeLessThanOrEqual(18);
      expect(preset.loop, preset.id).toBeGreaterThanOrEqual(2);
      expect(preset.loop, preset.id).toBeLessThanOrEqual(12);
      expect(preset.swing, preset.id).toBeGreaterThanOrEqual(0);
      expect(preset.swing, preset.id).toBeLessThan(1);
    }
  });
});

describe("swing", () => {
  it("leaves the downbeats alone and pushes the offbeats late", () => {
    expect(swingOffset(0, 0.6)).toBe(0);
    expect(swingOffset(2, 0.6)).toBe(0);
    expect(swingOffset(1, 0.6)).toBeCloseTo(0.3);
    expect(swingOffset(1, 0)).toBe(0);
  });
});

describe("the kit", () => {
  it("gives every piece its own MIDI note", () => {
    const midis = PERCUSSION.map((piece) => piece.midi);
    expect(new Set(midis).size, "two pieces share a MIDI note").toBe(
      midis.length,
    );
  });

  // The reverse map is hand-written, so this is the test that catches a typo
  // in it: a model's answer landing on the wrong drum, or on none at all.
  it("maps each piece's own note back to itself", () => {
    PERCUSSION.forEach((piece, band) => {
      expect(bandForDrumMidi(piece.midi), `${piece.id} does not round-trip`).toBe(
        band,
      );
    });
  });

  it("never sends a model's note to a band that does not exist", () => {
    for (let pitch = 0; pitch < 128; pitch++) {
      const band = bandForDrumMidi(pitch);
      if (band === null) continue;
      expect(band, `pitch ${pitch}`).toBeGreaterThanOrEqual(0);
      expect(band, `pitch ${pitch}`).toBeLessThan(PERC_BANDS);
    }
  });
});
