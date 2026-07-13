#!/usr/bin/env bash
set -euo pipefail

dir="$(dirname "$(realpath "$0")")"

# ── Download ─────────────────────────────────────────────────────
urls=(
  "https://assets.metrolinx.com/raw/upload/Documents/Metrolinx/Open%20Data/GO-GTFS.zip"
  "https://assets.metrolinx.com/raw/upload/Documents/Metrolinx/Open%20Data/UP-GTFS.zip"
)

for url in "${urls[@]}"; do
  name="$(basename "$url")"
  dest="$dir/$name"
  if [ -f "$dest" ]; then
    echo "$name already exists, skipping download"
  else
    echo "Downloading $name …"
    curl -fSLo "$dest" "$url"
  fi
done

# ── Extract ──────────────────────────────────────────────────────
for zip in "$dir"/*.zip; do
  [ -f "$zip" ] || continue

  name="$(basename "$zip" .zip)"
  dest="$dir/$name"

  echo "Extracting $zip → $dest/"
  mkdir -p "$dest"
  unzip -o -d "$dest" "$zip"
done