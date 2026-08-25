// The musical furniture: scales, chords, progressions, drum grooves, synth
// voices and the presets that combine them. Kept apart from the instrument so
// the theory can be checked by a test rather than by ear — see music.test.ts.
//
// Everything is expressed in semitones above the key root, and everything in
// this file stays inside A natural minor. That is what keeps "there is no way
// to play it wrong" true no matter which preset a stranger lands on.

export const KEY_HZ = 110; // A2

export type Scale = { id: string; name: string; steps: number[] };

export const SCALES: Scale[] = [
  { id: "minor", name: "Minor", steps: [0, 2, 3, 5, 7, 8, 10] },
  { id: "dorian", name: "Dorian", steps: [0, 2, 3, 5, 7, 9, 10] },
  { id: "pentatonic", name: "Pentatonic", steps: [0, 3, 5, 7, 10] },
  { id: "blues", name: "Blues", steps: [0, 3, 5, 6, 7, 10] },
];

// The pitch classes of A natural minor. Chords are checked against this.
export const IN_KEY = [0, 2, 3, 5, 7, 8, 10];

export type Chord = { name: string; tones: number[] };

// Tones ascend, so consecutive bands climb through the chord and then into the
// next octave of it. A three-note chord simply repeats sooner than a four.
export const CHORDS: Record<string, Chord> = {
  Am7: { name: "Am7", tones: [0, 3, 7, 10] },
  Am: { name: "Am", tones: [0, 3, 7] },
  Fmaj7: { name: "Fmaj7", tones: [8, 12, 15, 19] },
  F: { name: "F", tones: [8, 12, 15] },
  Cmaj7: { name: "Cmaj7", tones: [3, 7, 10, 14] },
  C: { name: "C", tones: [3, 7, 10] },
  G7: { name: "G7", tones: [10, 14, 17, 20] },
  G: { name: "G", tones: [10, 14, 17] },
  Dm7: { name: "Dm7", tones: [5, 8, 12, 15] },
  Dm: { name: "Dm", tones: [5, 8, 12] },
  Em7: { name: "Em7", tones: [7, 10, 14, 17] },
  Bdim: { name: "Bø", tones: [2, 5, 8, 12] },
};

export type Progression = { id: string; name: string; bars: Chord[] };

const P = (id: string, name: string, names: string[]): Progression => ({
  id,
  name,
  bars: names.map((n) => CHORDS[n]),
});

export const PROGRESSIONS: Progression[] = [
  P("lament", "Lament", ["Am7", "Fmaj7", "Cmaj7", "G7"]),
  P("anthem", "Anthem", ["Am", "F", "C", "G"]),
  P("turn", "Turnaround", ["Dm7", "G7", "Cmaj7", "Cmaj7"]),
  P("drift", "Drift", ["Am7", "Am7", "Dm7", "Dm7"]),
  P("climb", "Climb", ["Am7", "Bdim", "Cmaj7", "Dm7"]),
  P("fall", "Fall", ["Dm7", "Cmaj7", "Bdim", "Am7"]),
  P("drone", "Drone", ["Am7", "Am7", "Am7", "Am7"]),
];

export type Voice = {
  id: string;
  name: string;
  wave: OscillatorType;
  // Frequency modulation, as a ratio of the note and a depth in Hz. Zero ratio
  // means no modulator at all, which is most of them.
  fmRatio: number;
  fmDepth: number;
};

export const VOICES: Voice[] = [
  { id: "reed", name: "Reed", wave: "triangle", fmRatio: 0, fmDepth: 0 },
  { id: "glass", name: "Glass", wave: "sine", fmRatio: 0, fmDepth: 0 },
  { id: "hollow", name: "Hollow", wave: "square", fmRatio: 0, fmDepth: 0 },
  { id: "buzz", name: "Buzz", wave: "sawtooth", fmRatio: 0, fmDepth: 0 },
  { id: "bell", name: "Bell", wave: "sine", fmRatio: 2.4, fmDepth: 420 },
  { id: "metal", name: "Metal", wave: "square", fmRatio: 3.7, fmDepth: 260 },
  { id: "wood", name: "Wood", wave: "triangle", fmRatio: 1.5, fmDepth: 160 },
];

// Drum bands, bottom up. Ordered by pitch so the spectrogram reading still
// holds: the lower you draw, the lower it sounds.
export const KICK = 0;
export const TOM = 1;
export const SNARE = 2;
export const HAT = 3;

// Grooves are written in subdivisions of the loop. There are 32, which is four
// bars of four in eighth notes, so a beat is two subdivisions.
export const SUBDIVS = 32;

export type Hit = { band: number; sub: number; level: number };
export type Groove = { id: string; name: string; hits: Hit[] };

const on = (band: number, subs: number[], level = 0.85): Hit[] =>
  subs.map((sub) => ({ band, sub, level }));

const every = (step: number, from = 0): number[] => {
  const out: number[] = [];
  for (let s = from; s < SUBDIVS; s += step) out.push(s);
  return out;
};

export const GROOVES: Groove[] = [
  { id: "none", name: "None", hits: [] },
  {
    id: "four",
    name: "Four",
    hits: [
      ...on(KICK, every(2)),
      ...on(SNARE, every(4, 2), 0.75),
      ...on(HAT, every(1), 0.4),
    ],
  },
  {
    id: "back",
    name: "Backbeat",
    hits: [
      ...on(KICK, [0, 6, 8, 14, 16, 22, 24, 30]),
      ...on(SNARE, every(4, 2), 0.8),
      ...on(HAT, every(2), 0.45),
    ],
  },
  {
    id: "break",
    name: "Break",
    hits: [
      ...on(KICK, [0, 5, 10, 16, 21, 26]),
      ...on(SNARE, [4, 12, 20, 28], 0.8),
      ...on(HAT, every(2, 1), 0.4),
      ...on(TOM, [15, 31], 0.6),
    ],
  },
  {
    id: "half",
    name: "Half time",
    hits: [
      ...on(KICK, [0, 16]),
      ...on(SNARE, [8, 24], 0.8),
      ...on(HAT, every(4), 0.4),
    ],
  },
  {
    id: "sparse",
    name: "Sparse",
    hits: [...on(KICK, [0, 12]), ...on(SNARE, [20], 0.7), ...on(HAT, every(8), 0.35)],
  },
  {
    id: "tribal",
    name: "Tribal",
    hits: [
      ...on(KICK, [0, 3, 8, 11, 16, 19, 24, 27]),
      ...on(TOM, [6, 14, 22, 30], 0.7),
      ...on(HAT, every(4, 2), 0.35),
    ],
  },
];

export type Preset = {
  id: string;
  name: string;
  voice: string;
  progression: string;
  groove: string;
  cutoff: number;
  resonance: number;
  chords: boolean;
  voicing: boolean;
  arp: boolean;
  swing: number;
  loop: number;
};

// Each preset is a whole instrument, not a patch. A stranger who presses one
// gets a different thing to play, which is the point: the depth is reachable
// without a control surface.
export const PRESETS: Preset[] = [
  {
    id: "dust",
    name: "Dust",
    voice: "reed",
    progression: "lament",
    groove: "sparse",
    cutoff: 2200,
    resonance: 2,
    chords: true,
    voicing: true,
    arp: false,
    swing: 0,
    loop: 6,
  },
  {
    id: "neon",
    name: "Neon",
    voice: "buzz",
    progression: "anthem",
    groove: "four",
    cutoff: 1900,
    resonance: 9,
    chords: true,
    voicing: true,
    arp: true,
    swing: 0,
    loop: 4,
  },
  {
    id: "rain",
    name: "Rain",
    voice: "bell",
    progression: "drift",
    groove: "half",
    cutoff: 5200,
    resonance: 1,
    chords: true,
    voicing: true,
    arp: true,
    swing: 0,
    loop: 8,
  },
  {
    id: "tape",
    name: "Tape",
    voice: "hollow",
    progression: "turn",
    groove: "break",
    cutoff: 1500,
    resonance: 4,
    chords: true,
    voicing: true,
    arp: false,
    swing: 0.6,
    loop: 5,
  },
  {
    id: "chapel",
    name: "Chapel",
    voice: "glass",
    progression: "drone",
    groove: "none",
    cutoff: 3200,
    resonance: 0,
    chords: true,
    voicing: true,
    arp: false,
    swing: 0,
    loop: 9,
  },
  {
    id: "engine",
    name: "Engine",
    voice: "metal",
    progression: "climb",
    groove: "back",
    cutoff: 1000,
    resonance: 13,
    chords: true,
    voicing: false,
    arp: true,
    swing: 0,
    loop: 3.5,
  },
  {
    id: "clay",
    name: "Clay",
    voice: "wood",
    progression: "fall",
    groove: "tribal",
    cutoff: 2600,
    resonance: 5,
    chords: true,
    voicing: true,
    arp: true,
    swing: 0.56,
    loop: 6.5,
  },
];

export function byId<T extends { id: string }>(list: T[], id: string): T {
  return list.find((item) => item.id === id) ?? list[0];
}

// Where a band sits, in semitones above the key. Locked to a chord, successive
// bands are successive chord tones, so the keyboard moves with the harmony.
// Unlocked, they are degrees of the scale.
export function semitoneOf(
  index: number,
  tones: number[],
): number {
  const span = tones.length;
  return tones[index % span] + 12 * Math.floor(index / span);
}

// The bands that voice a single mark as a chord. Against a chord the next two
// bands already are the next chord tones; against a scale it takes a third and
// a fifth, which is two and four degrees up.
export function voiceOffsets(locked: boolean): [number, number] {
  return locked ? [1, 2] : [2, 4];
}

// Swing pushes every second subdivision later, by up to half a subdivision.
export function swingOffset(sub: number, swing: number): number {
  return sub % 2 === 1 ? swing * 0.5 : 0;
}
