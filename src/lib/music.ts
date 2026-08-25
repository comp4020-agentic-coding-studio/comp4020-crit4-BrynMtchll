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

// `name` is what gets drawn on the loop; `symbol` is what a chord parser can
// read. They differ where the nice-looking name is not machine-readable — the
// half-diminished sign is the reason this field exists at all.
export type Chord = { name: string; symbol: string; tones: number[] };

// Tones ascend, so consecutive bands climb through the chord and then into the
// next octave of it. A three-note chord simply repeats sooner than a four.
export const CHORDS: Record<string, Chord> = {
  Am7: { name: "Am7", symbol: "Am7", tones: [0, 3, 7, 10] },
  Am: { name: "Am", symbol: "Am", tones: [0, 3, 7] },
  Fmaj7: { name: "Fmaj7", symbol: "Fmaj7", tones: [8, 12, 15, 19] },
  F: { name: "F", symbol: "F", tones: [8, 12, 15] },
  Cmaj7: { name: "Cmaj7", symbol: "Cmaj7", tones: [3, 7, 10, 14] },
  C: { name: "C", symbol: "C", tones: [3, 7, 10] },
  G7: { name: "G7", symbol: "G7", tones: [10, 14, 17, 20] },
  G: { name: "G", symbol: "G", tones: [10, 14, 17] },
  Dm7: { name: "Dm7", symbol: "Dm7", tones: [5, 8, 12, 15] },
  Dm: { name: "Dm", symbol: "Dm", tones: [5, 8, 12] },
  Em7: { name: "Em7", symbol: "Em7", tones: [7, 10, 14, 17] },
  Bdim: { name: "Bø", symbol: "Bm7b5", tones: [2, 5, 8, 12] },
};

// MIDI note for the key root, so pitches can cross into a model's vocabulary
// and back. A2 is MIDI 45.
export const KEY_MIDI = 45;

// The General MIDI pitch each band stands for, so a model trained on a real
// kit can be primed with this one. Filled in from PERCUSSION below, where the
// kit is defined.
export function drumMidi(): number[] {
  return PERCUSSION.map((piece) => piece.midi);
}

// A model answers with the whole General MIDI kit, most of which this one does
// not have. Anything unmapped is dropped rather than guessed at.
export function bandForDrumMidi(pitch: number): number | null {
  if (pitch === 35) return SUB;
  if (pitch === 36) return KICK;
  if ([41, 43, 45, 47, 48, 50].includes(pitch)) return TOM;
  if (pitch === 38 || pitch === 40) return SNARE;
  if (pitch === 39) return CLAP;
  if (pitch === 37) return RIM;
  if (pitch === 42 || pitch === 44) return HAT;
  if ([46, 49, 51, 52, 53, 55, 57, 59].includes(pitch)) return OPEN;
  return null;
}

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
  { id: "ring", name: "Ring", wave: "sine", fmRatio: 1, fmDepth: 300 },
  { id: "nasal", name: "Nasal", wave: "sawtooth", fmRatio: 5.1, fmDepth: 140 },
  { id: "growl", name: "Growl", wave: "sawtooth", fmRatio: 0.5, fmDepth: 90 },
  { id: "round", name: "Round", wave: "sine", fmRatio: 0.5, fmDepth: 40 },
];

// The kit, bottom up. Ordered by pitch so the spectrogram reading still holds:
// the lower you draw, the lower it sounds. `midi` is the General MIDI drum this
// band stands for, which is how a model trained on a real kit can talk to it.
export type Percussion = { id: string; name: string; midi: number };

export const PERCUSSION: Percussion[] = [
  { id: "sub", name: "Sub", midi: 35 },
  { id: "kick", name: "Kick", midi: 36 },
  { id: "tom", name: "Tom", midi: 45 },
  { id: "snare", name: "Snare", midi: 38 },
  { id: "clap", name: "Clap", midi: 39 },
  { id: "rim", name: "Rim", midi: 37 },
  { id: "hat", name: "Hat", midi: 42 },
  { id: "open", name: "Open hat", midi: 46 },
];

export const SUB = 0;
export const KICK = 1;
export const TOM = 2;
export const SNARE = 3;
export const CLAP = 4;
export const RIM = 5;
export const HAT = 6;
export const OPEN = 7;

export const PERC_BANDS = PERCUSSION.length;

// Bands given to the bass: the chord's own tones, an octave below the melody
// register, on a separate synth. Bass is most of what makes a loop sound like
// a piece of music rather than a texture.
export const BASS_BANDS = 4;

// Vowels, as the first three formants in Hz. Parking bandpass filters here
// turns any oscillator into a voice — no recording involved, which is what
// keeps this inside a spec that says sound must be made live in the page.
export type Vowel = { id: string; name: string; formants: number[] };

export const VOWELS: Vowel[] = [
  { id: "none", name: "None", formants: [] },
  { id: "ah", name: "Ah", formants: [730, 1090, 2440] },
  { id: "eh", name: "Eh", formants: [530, 1840, 2480] },
  { id: "ee", name: "Ee", formants: [270, 2290, 3010] },
  { id: "oh", name: "Oh", formants: [570, 840, 2410] },
  { id: "oo", name: "Oo", formants: [300, 870, 2240] },
];

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
      ...on(HAT, every(1), 0.34),
      ...on(OPEN, every(8, 6), 0.4),
    ],
  },
  {
    id: "back",
    name: "Backbeat",
    hits: [
      ...on(KICK, [0, 6, 8, 14, 16, 22, 24, 30]),
      ...on(SNARE, every(4, 2), 0.8),
      ...on(HAT, every(2), 0.38),
      ...on(RIM, every(4), 0.3),
    ],
  },
  {
    id: "break",
    name: "Break",
    hits: [
      ...on(KICK, [0, 5, 10, 16, 21, 26]),
      ...on(SNARE, [4, 12, 20, 28], 0.8),
      ...on(HAT, every(2, 1), 0.36),
      ...on(TOM, [15, 31], 0.6),
      ...on(CLAP, [12, 28], 0.5),
    ],
  },
  {
    id: "half",
    name: "Half time",
    hits: [
      ...on(SUB, [0, 16], 0.8),
      ...on(KICK, [0, 16]),
      ...on(SNARE, [8, 24], 0.8),
      ...on(HAT, every(4), 0.36),
    ],
  },
  {
    id: "sparse",
    name: "Sparse",
    hits: [
      ...on(KICK, [0, 12]),
      ...on(SNARE, [20], 0.7),
      ...on(HAT, every(8), 0.32),
    ],
  },
  {
    id: "tribal",
    name: "Tribal",
    hits: [
      ...on(KICK, [0, 3, 8, 11, 16, 19, 24, 27]),
      ...on(TOM, [6, 14, 22, 30], 0.7),
      ...on(RIM, every(4, 2), 0.35),
      ...on(HAT, every(4), 0.3),
    ],
  },
  {
    id: "house",
    name: "House",
    hits: [
      ...on(SUB, every(2), 0.55),
      ...on(KICK, every(2)),
      ...on(CLAP, every(4, 2), 0.55),
      ...on(OPEN, every(2, 1), 0.32),
    ],
  },
  {
    id: "trap",
    name: "Trap",
    hits: [
      ...on(SUB, [0, 10, 16, 26], 0.85),
      ...on(KICK, [0, 10, 16, 26]),
      ...on(SNARE, [8, 24], 0.7),
      ...on(HAT, [0, 1, 2, 4, 6, 7, 8, 10, 12, 14, 15, 16, 18, 20, 22, 23, 24, 26, 28, 30], 0.3),
    ],
  },
];

export type Preset = {
  id: string;
  name: string;
  voice: string;
  bass: string;
  vowel: string;
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
    bass: "round",
    vowel: "none",
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
    bass: "growl",
    vowel: "none",
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
    bass: "glass",
    vowel: "oo",
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
    bass: "reed",
    vowel: "ah",
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
    bass: "round",
    vowel: "ah",
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
    bass: "buzz",
    vowel: "none",
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
    bass: "hollow",
    vowel: "eh",
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
