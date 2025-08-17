#!/usr/bin/env bash
set -euo pipefail

DIR="assets/piano"
DUR="${1:-1.2}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Please install ffmpeg first." >&2
  exit 1
fi

echo "Trimming MP3 samples in $DIR to ${DUR}s (in place)"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

shopt -s nullglob
for f in "$DIR"/*.mp3; do
  base=$(basename "$f")
  out="$tmpdir/$base"
  # Copy metadata if any, trim duration, re-encode at 128k to keep size small
  ffmpeg -hide_banner -loglevel error -y -i "$f" -t "$DUR" -c:a libmp3lame -b:a 128k "$out"
  mv "$out" "$f"
  echo "Trimmed $base"
done
echo "Done."

