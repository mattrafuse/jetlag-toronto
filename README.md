# Jetlag Map

A web implementation of **Jet Lag: The Game** — the hide-and-seek / tag style
game made famous by the YouTube series — built for the Greater Toronto Area.

Players use the map to ask location-based questions (radar, thermometer,
measuring, matching, photo, tentacles) about where the other team is hiding,
draw exclusion zones as answers rule out areas, and track transit stations
(GO, UP Express, and Toronto subway) as hubs they can travel between.

The app is a single-page map UI (Leaflet + React) backed by a small Express
server that resolves Google Maps short URLs into coordinates.

## Features

- **Interactive map** (Leaflet) centered on Toronto with light/dark themes.
- **Question sidebar** with multiple question categories (radar, thermometer,
  measuring, matching, photo, tentacles).
- **Exclusion zones** — draw polygons on the map to rule out where a team can
  be; stations inside excluded areas are greyed out automatically.
- **Transit layers** — GO train, UP Express, and subway lines/stations pulled
  from Metrolinx open GTFS data, plus a custom game border mask.
- **Shareable game state** — the full game (settings, view, questions,
  exclusions) is encoded in the URL so two players can stay in sync by sharing
  a link.
- **Locate / settings panels** for finding your position and toggling layers.

## Architecture

| Component | Purpose | Port |
| --- | --- | --- |
| `ui` | Built Vite web UI served by `vite preview` | `3000` (internal) |
| `server` | Express API that resolves Google Maps URLs (`/api/resolve`, `/health`) | `3001` (internal) |
| `nginx` | Reverse proxy that routes `/api/` and `/health` to the server and everything else to the UI | `8080` (host) |

In local development the Vite dev server proxies `/api` and `/health` directly
to the Express server (see `vite.config.ts`), so you don't need nginx.

## Prerequisites

- **Node.js** (the server runs with `--experimental-strip-types`, so a recent
  Node 22+ is recommended).
- **pnpm** (the lockfile and `pnpm-workspace.yaml` require pnpm 10+).
- **Docker** and **Docker Compose** (only needed for the containerized setup).

## Local development

Install dependencies and start both the UI and the API server together:

```bash
pnpm install
pnpm dev
```

This runs `pnpm dev:ui` (Vite, opens at `http://localhost:5173`) and
`pnpm dev:server` (Express on `http://localhost:3001`) concurrently. The Vite
server proxies API calls to the Express server, so just open the Vite URL.

Useful scripts:

```bash
pnpm dev:ui       # Vite dev server only
pnpm dev:server   # Express resolve server only (PORT=3001)
pnpm build        # Production build of the web UI into dist/
pnpm preview      # Serve the built UI
pnpm test         # Run the Vitest suite once
pnpm test:watch   # Run tests in watch mode
pnpm server       # Run the Express server standalone
```

### Loading transit data (optional)

The `data/` folder ships with extracted GTFS feeds, but you can refresh them
from Metrolinx open data:

```bash
bash data/extract.sh        # download + unzip GO-GTFS and UP-GTFS
python data/parse_shapes.py # regenerate shape GeoJSON used by the layers
```

## Docker Compose

The `docker-compose.yml` spins up the full stack using prebuilt images from
GitHub Container Registry. This is the easiest way to run a production-like
instance.

```bash
docker compose up -d
```

Then open <http://localhost:8080>.

### What each service does

```yaml
services:
  ui:
    image: ghcr.io/mattrafuse/jetlag-ui:latest
    restart: unless-stopped
    expose:
      - "3000"          # only reachable inside the compose network

  server:
    image: ghcr.io/mattrafuse/jetlag-server:latest
    restart: unless-stopped
    environment:
      - PORT=3001
      - NODE_ENV=production
    expose:
      - "3001"          # only reachable inside the compose network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      - ui
      - server
    ports:
      - "8080:80"       # published to the host
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

- **`ui`** — serves the compiled web UI (from `Dockerfile`, which runs
  `pnpm build` then `pnpm preview`). It is `expose`d on port `3000`, meaning it
  is only reachable from other containers on the compose network, not from your
  host.
- **`server`** — runs the Express resolve API (`Dockerfile.server`). It reads
  `PORT` and `NODE_ENV` from the environment and is `expose`d on `3001`.
- **`nginx`** — the only service with a `ports` mapping. It listens on `80`
  inside the container and publishes that as `8080` on your host. It uses
  `./nginx.conf` (mounted read-only) to route traffic:
  - `location /api/` and `location = /health` → the `server` upstream
    (`server:3001`)
  - everything else (`location /`) → the `ui` upstream (`ui:3000`)

Because `ui` and `server` only `expose` their ports, the **nginx container is
the single entry point** — you never talk to the UI or API directly from the
host. `depends_on` ensures nginx starts after the other two.

### Building the images yourself

If you'd rather build locally instead of pulling from the registry, build the
two images and point the compose file at them:

```bash
docker build -f Dockerfile -t jetlag-ui .
docker build -f Dockerfile.server -t jetlag-server .
```

Then adjust the `image:` lines in `docker-compose.yml` (or add
`build:` contexts) to use your local tags.

## Project structure

```
main.ts              App entry: boots the Leaflet map and layers
map-view.ts          Map view state (center/zoom persistence)
overlay.tsx          In-map overlay UI
questions/           Question categories, store, exclusion zones, station registry
layers/              Leaflet layers: border, hubs, location, station, subway, train
components/          React UI: settings + sidebar panels
server/              Express resolve server (Google Maps URL → lat/lng)
data/                Metrolinx GTFS feeds + shape parsing scripts
static/              Static assets
```

## Notes

- Game state is stored in `localStorage` (key `jetlag-map-settings`) and can be
  shared via the URL (see `state-link.ts`).
- The map defaults to Toronto (`[43.6532, -79.3832]`, zoom 12).
