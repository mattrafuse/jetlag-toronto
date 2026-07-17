#!/usr/bin/env bash
set -euo pipefail

pnpm exec oxlint
pnpm exec oxfmt --check
