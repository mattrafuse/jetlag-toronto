// ── Shared React overlay root ──────────────────────────────────
// Single React root that renders both the Settings panel and the
// Questions sidebar panel, so they coexist in one React tree.

import { Stack, useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import { LocateButton } from "./components/settings/LocateButton";
import { ToggleSettingsButton } from "./components/settings/ToggleSettingsButton";
import { TogglePanelButton } from "./components/sidebar/TogglePanelButton";
import { SettingsPanel } from "./panels/SettingsPanel";
import { SidebarPanel } from "./panels/SidebarPanel";
import { settingsStore } from "./settings-store";
import { createAppTheme } from "./theme";

let root: ReturnType<typeof createRoot> | null = null;

// ── Overlay root ───────────────────────────────────────────────
// Wrapped in a ThemeProvider so the UI follows the map's dark mode.
const Overlay = () => {
  const { darkMode } = settingsStore.get();

  const isSmall = useMediaQuery("(max-width:600px)");

  return (
    <ThemeProvider theme={createAppTheme(darkMode)}>
      <CssBaseline />
      <Stack
        direction={isSmall ? "column" : "row"}
        sx={isSmall ? { width: "100%" } : { height: "100%" }}
      >
        <Stack direction={isSmall ? "row" : "column"} spacing={1} sx={{ p: 1 }}>
          <TogglePanelButton />

          <ToggleSettingsButton />

          <LocateButton />
        </Stack>

        <SettingsPanel />
        <SidebarPanel />
      </Stack>
    </ThemeProvider>
  );
};

export const initOverlay = (): void => {
  const container = document.getElementById("app-overlay")!;

  root = createRoot(container);

  root.render(<Overlay />);

  // Re-render the overlay whenever the settings store changes so the
  // theme updates in response to the dark mode toggle.
  settingsStore.subscribe(() => root?.render(<Overlay />));
};
