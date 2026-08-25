# Process overview

A map to how Carousel came together, and where to look for the evidence.

## What I built

Carousel is a drawn instrument. The loop is a spectrogram you paint on: it
scrolls leftward past a fixed play bar, and whatever crosses that bar sounds.
Low marks are an eight-piece kit, the middle band is a bass, the top is a lead —
each its own synth. Underneath sits a chord progression in A minor, and the
pitch bands *are* its chord tones, so a note held across a bar line retunes to
stay inside the harmony. Nothing about a drawn note's length or loudness is
quantised; only the drums snap, so the pulse locks while the melody stays drawn.

It started as a theremin. I built one, listened to it, and heard that a
continuous mouse-driven glissando is expressive for about ten seconds and then
just tiring. I threw it away before committing it — the first repo state that
exists is already the drawing machine
([`eed1cec`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/eed1cec)).
That deletion is not in the history, which is the honest version: it was a
judgement made by ear, not a diff.

## The moments that mattered

### 1. A check that lied twice, and would have lied silently

My crit-4 spec test claimed to require two input modalities. It was wrong in two
independent ways. The production minifier rewrites `"pointerdown"` as a template
literal, and my regex only accepted `'` and `"` — so a working instrument read
as having *no* listeners. And `expect.arrayContaining([any(String),
any(String)])` passes when both matchers match the *same* element, so the
assertion only ever required one modality despite its name and failure message.

The obvious move was fixing the regex. That alone would have turned the test
**green on a pointer-only instrument** — a false pass, which is worse than the
false fail I started with. So I fixed the counting too, and made the failure
message name what it actually found
([`ddeca07`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/ddeca07)).

How I knew it had taken: the test went red for the *right* reason —
`Found: mouse/pointer: expected 1 to be greater than or equal to 2` — and stayed
red until keyboard input genuinely existed. This is the week's lesson arriving
early: the sensor said yes and was wrong.

### 2. A bug I could not reproduce, because it was two bugs and a ghost

I kept hearing sound with nothing on screen. The agent guessed twice — hot-reload
leaks, then its own test browser — and both guesses were wrong. What settled it
was measuring instead: an analyser on the master bus reading **0.000000 RMS**
with an empty field, and a single mark sounding twice in nine seconds, 6.1s
apart — exactly one pass per loop. The engine was innocent.

The measurement found a real defect anyway. Rubbing out subtracted with the same
soft falloff it painted with, so erased edges approached zero without reaching
it, and the residue sat *below* the point where the heat ramp separates from the
background: invisible, still audible, and rubbing out looked broken. Rather than
nudge the threshold, I made it an invariant — **audible implies visible** — by
snapping erasure to true zero and having the play bar treat anything below that
as silence
([`4170ecd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/4170ecd)).

The ghost was mine: stale audio contexts in a tab left open across a dozen hot
reloads. Fixing that is in the same range, but the lesson I kept is the rule
about guessing — I stopped accepting a diagnosis that hadn't been measured.

### 3. "The drums sound indistinct" was not a timbre problem

I asked for the drum sounds to be made more distinct. They were already
distinct; they were all firing at once. The brush spread ±1 band vertically,
which deposited **0.18 into the neighbouring band — exactly the onset
threshold** — so every kick also triggered the tom. Making the sounds fancier
would have buried the cause under a better-sounding symptom. The fix was to give
drums almost no vertical spread and forbid any stroke from crossing a region
boundary
([`ab2bc94`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/ab2bc94)).

The same commit carries a bug that would have cost marks at the crit itself: the
canvas resize guard compared only widths, so any height-only resize left a stale
backing store to be squashed into the new box, throwing everything drawn off by
a fifth of the height. I found it by measuring pixels per band in the browser
after my read of a screenshot disagreed with my read of the code. It would have
broken on any window that was not the shape of mine.

### 4. Proving what I cannot hear

The premise of the week is that an agent can build a synth and not hear the
result. The corollary I acted on: anything about this instrument that is
*checkable* should be checked, so my ear is spent only on what isn't.

So the theory moved out of the instrument into `src/lib/music.ts` and grew a test
suite — **59 tests** now — that proves every chord is diatonic to A minor, that
bands climb without repeating a pitch, that voicing a mark only ever adds tones
of the chord it voices, that no groove double-hits a drum, that every piece of
the kit round-trips through the hand-written MIDI map, and that every pitch the
instrument can produce folds into the melody model's 36-note vocabulary without
changing note
([`ab2bc94...156dae4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/compare/ab2bc94...156dae4)).

That last one earned itself immediately: the melody model rejected the whole
sequence with `pitch outside of the valid range: 84`, because my bands reach
MIDI 91 and it only knows 48–83. Folding by octaves preserves pitch class, so
the harmony survives where clamping would have collapsed a run onto one wrong
note. I could not have heard that; I could prove it.

## Where the harness changed

The corrections that stuck went into the checks, not into retries:

- a spec test that counts distinct modalities and says what it found, instead of
  one that passed on one modality
  ([`ddeca07`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/ddeca07))
- the audible-implies-visible invariant, enforced in the code rather than
  remembered
  ([`4170ecd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/commit/4170ecd))
- a tested theory module, so "is this in key" stopped being a matter of opinion
  ([`ab2bc94...156dae4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-BrynMtchll/compare/ab2bc94...156dae4))

## What the checks still cannot see

Latency, feel, and whether a gesture is expressive or merely exhausting. Nothing
in the suite knows whether the arpeggiator is better than the sustain, whether
the vowel filters sound like a voice or like a broken radio, or whether a
stranger picks this up and plays it. Those I judged by ear, and the pod will
judge them again cold.
