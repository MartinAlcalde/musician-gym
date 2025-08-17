Functional Ear Training – Minimal Web Clone

What Is Functional Ear Training
- Focus: recognizing scale degrees by their function within a key, not by absolute pitch or isolated intervals.
- Context first: you always hear a short cadence that establishes the tonic (here: C major).
- Task: after the cadence, a single target note plays. You identify its degree relative to the tonic (1=Do, 2=Re, 3=Mi, 4=Fa).
- Feedback: immediate correct/incorrect response, optionally followed by a resolution back to the tonic to reinforce the sound.

App Overview (This Project)
- Key: fixed C major for v1.
- Range: first half‑octave C–F (Do–Fa) as the answer set; the keyboard UI shows C4–C5 for familiarity.
- Cadence: I–IV–V–I triads (simple voicings) to establish context.
- Audio: real piano using Tone.js Sampler with locally embedded samples (no CDN, no server required).

How To Use
- Open `index.html` directly (double‑click) — works with `file://` offline.
- Click `Start / Next` to begin a round: hear the cadence, then the target note.
- Answer by clicking a white key C, D, E, or F (or use number keys 1–4).
- See immediate feedback and optional resolution to C. Click `Start / Next` for the next round.

Controls
- `Start / Next`: plays cadence and presents a new target.
- `Resolve to C` (checkbox): when enabled, plays target→tonic after you answer.
- Piano UI: C4–C5, with black keys for visual realism (only C–F are valid answers in v1).
- Shortcuts: `Enter` to start; `1..4` map to C–F.

Stats
- Tracks attempts, correct answers, and accuracy for the current session (no persistence yet).

Tech Notes
- 100% local: `assets/lib/Tone.js` is vendored and piano samples are embedded as base64 in `assets/piano.base64.js`.
- No network or HTTP server needed; works offline from the filesystem.
- Simple, deterministic audio scheduling; volumes kept conservative to avoid clipping.

Roadmap Ideas (Optional)
- Expand degrees (add G–B and octave C) and adaptive weighting by performance.
- Add replay buttons (cadence/target), auto‑advance, and Do/Re/Mi/Fa label toggle.
- Export minimal session stats.

Credits
- Piano samples adapted from the Salamander set as used in Tone.js demos (trimmed and embedded for local use).
