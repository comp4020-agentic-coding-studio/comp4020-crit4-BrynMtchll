// Continuation, by a model that runs in this page.
//
// Two of Magenta's MusicRNN checkpoints are vendored into public/models: a
// drum kit model and a melody model conditioned on chords. Both run on
// TensorFlow.js in the browser, which is what makes them usable here at all —
// the site is static, so there is nowhere to put an API key, and a hosted
// service would break the spec line that says the browser is the instrument.
//
// The weights are committed rather than fetched from Google's bucket at play
// time. The crit is live in a room; a demo that depends on someone else's CDN
// being quick is a demo that can fail in front of the pod.
//
// The library is frozen at 1.23.1 and effectively unmaintained, so everything
// here is written to fail soft: if a model will not load or answers with
// nonsense, the instrument carries on exactly as it did before.

export type Note = { step: number; steps: number; pitch: number };
export type Beat = { step: number; band: number };

// The slice of Magenta's surface this uses, typed locally so the library is
// only ever loaded at runtime and never at build time.
type NoteSequence = {
  notes: {
    pitch: number;
    quantizedStartStep: number;
    quantizedEndStep: number;
    isDrum?: boolean;
  }[];
  quantizationInfo: { stepsPerQuarter: number };
  totalQuantizedSteps: number;
};

type Rnn = {
  initialize(): Promise<void>;
  continueSequence(
    sequence: NoteSequence,
    steps: number,
    temperature?: number,
    chordProgression?: string[],
  ): Promise<NoteSequence>;
};

type MusicRnnModule = { MusicRNN: new (checkpoint: string) => Rnn };

// A loop is 32 eighth notes, so two steps to the quarter.
export const STEPS_PER_QUARTER = 2;

// chord_pitches_improv is a 36-class model: it knows C3 to B5 and refuses
// anything else outright. The instrument's bands climb well past that, so a
// seed has to be brought into the model's vocabulary before it will look at it.
export const MODEL_MIN_PITCH = 48;
export const MODEL_MAX_PITCH = 83;

// Folded by octaves rather than clamped. An octave keeps the pitch class, so a
// note stays the same note of the same chord and the harmony is untouched;
// clamping would flatten a run of high notes onto one wrong pitch.
export function foldIntoRange(pitch: number): number {
  let folded = pitch;
  while (folded < MODEL_MIN_PITCH) folded += 12;
  while (folded > MODEL_MAX_PITCH) folded -= 12;
  return folded;
}

const loaded = new Map<string, Promise<Rnn>>();

function load(base: string, name: string): Promise<Rnn> {
  const url = `${base}models/${name}`;
  let pending = loaded.get(url);
  if (pending) return pending;

  pending = (async () => {
    const mod = (await import(
      "@magenta/music/esm/music_rnn"
    )) as unknown as MusicRnnModule;
    const rnn = new mod.MusicRNN(url);
    await rnn.initialize();
    return rnn;
  })();

  // A failed load must not be cached as a permanent refusal.
  pending.catch(() => loaded.delete(url));
  loaded.set(url, pending);
  return pending;
}

function sequence(
  notes: NoteSequence["notes"],
  totalSteps: number,
): NoteSequence {
  return {
    notes,
    quantizationInfo: { stepsPerQuarter: STEPS_PER_QUARTER },
    totalQuantizedSteps: totalSteps,
  };
}

// Continues a melody, told which chord is in force for each step it invents so
// what comes back belongs to the progression already on screen.
export async function continueMelody(
  base: string,
  seed: Note[],
  chordPerStep: string[],
  from: number,
  temperature: number,
): Promise<Note[]> {
  if (seed.length === 0 || chordPerStep.length === 0) return [];

  const rnn = await load(base, "chord_pitches_improv");
  const primed = sequence(
    seed.map((note) => ({
      pitch: foldIntoRange(note.pitch),
      quantizedStartStep: note.step,
      quantizedEndStep: note.step + note.steps,
    })),
    from,
  );

  const out = await rnn.continueSequence(
    primed,
    chordPerStep.length,
    temperature,
    chordPerStep,
  );

  return (out.notes ?? []).map((note) => ({
    // The model answers in its own timeline, starting at zero.
    step: from + note.quantizedStartStep,
    steps: Math.max(1, note.quantizedEndStep - note.quantizedStartStep),
    pitch: note.pitch,
  }));
}

// Continues a drum pattern. Polyphonic, so several bands can land on one step.
export async function continueDrums(
  base: string,
  seed: Beat[],
  drumMidi: number[],
  from: number,
  steps: number,
  temperature: number,
): Promise<{ step: number; pitch: number }[]> {
  if (seed.length === 0 || steps <= 0) return [];

  const rnn = await load(base, "drum_kit_rnn");
  const primed = sequence(
    seed.map((beat) => ({
      pitch: drumMidi[beat.band],
      quantizedStartStep: beat.step,
      quantizedEndStep: beat.step + 1,
      isDrum: true,
    })),
    from,
  );

  const out = await rnn.continueSequence(primed, steps, temperature);

  return (out.notes ?? []).map((note) => ({
    step: from + note.quantizedStartStep,
    pitch: note.pitch,
  }));
}
