// ── MUI theme ──────────────────────────────────────────────────
// Builds a light/dark theme that follows the map's dark mode
// setting, so the React overlay matches the basemap.

import { createTheme } from "@mui/material/styles";

export const createAppTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
    shape: {
      borderRadius: 8,
    },
  });
