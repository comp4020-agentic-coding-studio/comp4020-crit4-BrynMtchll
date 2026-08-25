import { describe, expect, it } from "vitest";
import { KEY_MIDI, PROGRESSIONS, SCALES, semitoneOf } from "./music";
import {
  MODEL_MAX_PITCH,
  MODEL_MIN_PITCH,
  foldIntoRange,
} from "./suggest";

// The melody model knows a 36-note vocabulary and throws on anything outside
// it, which is exactly how this was found: a seed built from the instrument's
// own bands reached MIDI 91 and the model refused the whole sequence. These
// tests cover the fold, and the fact that every pitch the instrument can
// produce survives it.

describe("folding pitches into the model's vocabulary", () => {
  it("leaves pitches already in range alone", () => {
    for (let pitch = MODEL_MIN_PITCH; pitch <= MODEL_MAX_PITCH; pitch++) {
      expect(foldIntoRange(pitch)).toBe(pitch);
    }
  });

  it("brings anything else into range", () => {
    for (let pitch = 0; pitch < 128; pitch++) {
      const folded = foldIntoRange(pitch);
      expect(folded, `${pitch} folded to ${folded}`).toBeGreaterThanOrEqual(
        MODEL_MIN_PITCH,
      );
      expect(folded).toBeLessThanOrEqual(MODEL_MAX_PITCH);
    }
  });

  it("only ever moves by whole octaves, so the note keeps its identity", () => {
    for (let pitch = 0; pitch < 128; pitch++) {
      // Math.abs before the modulo: folding a high note down gives a negative
      // difference, -24 % 12 is -0, and Object.is(-0, 0) is false, so toBe(0)
      // would fail on correct arithmetic.
      expect(Math.abs(foldIntoRange(pitch) - pitch) % 12).toBe(0);
    }
  });

  it("covers every pitch class, so no note is unreachable", () => {
    const classes = new Set<number>();
    for (let pitch = 0; pitch < 128; pitch++) {
      classes.add(foldIntoRange(pitch) % 12);
    }
    expect(classes.size).toBe(12);
  });
});

describe("every pitch this instrument can make survives the fold", () => {
  // 16 pitched bands, against every chord of every progression and every
  // scale — the full set of notes the instrument is able to hand the model.
  const layouts: number[][] = [
    ...PROGRESSIONS.flatMap((p) => p.bars.map((c) => c.tones)),
    ...SCALES.map((s) => s.steps),
  ];

  it("folds into range without changing pitch class", () => {
    for (const tones of layouts) {
      for (let band = 0; band < 16; band++) {
        const midi = KEY_MIDI + semitoneOf(band, tones);
        const folded = foldIntoRange(midi);

        expect(folded).toBeGreaterThanOrEqual(MODEL_MIN_PITCH);
        expect(folded).toBeLessThanOrEqual(MODEL_MAX_PITCH);
        expect(folded % 12, `band ${band} changed note`).toBe(midi % 12);
      }
    }
  });
});
