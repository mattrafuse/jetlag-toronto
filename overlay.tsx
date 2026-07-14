// ── Shared React overlay root ──────────────────────────────────
// Single React root that renders both the Settings panel and the
// Questions sidebar panel, so they coexist in one React tree.

import { Stack } from "@mui/material";
import { createRoot } from "react-dom/client";
import { SidebarPanel } from "./questions/SidebarPanel";
import { SettingsPanel } from "./SettingsPanel";

let root: ReturnType<typeof createRoot> | null = null;

export function initOverlay(): void {
  const container = document.createElement("div");
  container.id = "app-overlay";
  document.body.append(container);

  root = createRoot(container);
  root.render(
    <Stack spacing={1}>
      <SettingsPanel />
      <SidebarPanel />
    </Stack>,
  );
}
