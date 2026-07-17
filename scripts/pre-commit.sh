#!/usr/bin/env bash
set -euo pipefail

pnpm exec oxlint --fix
pnpm exec oxfmt
