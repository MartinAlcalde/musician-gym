Assets for Functional Ear Training

- Source: Tone.js Salamander piano samples (public demo set).
- Local anchors included to cover full range via pitch shifting:
  - A2, A3, A4, A5, C3, C4, C5, C6

Notes
- The hosted set only publishes selected anchor notes; many other filenames return 404.
- Tone.js Sampler pitch-shifts nearby notes from these anchors, which is how most apps do it.

Optional: Trim long tails to reduce size
- Requires ffmpeg installed on your system.
- Run: `bash tools/trim-piano.sh 1.2` to create trimmed copies (~1.2s) in-place.

