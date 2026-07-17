import { Settings as SettingsIcon } from "@mui/icons-material";
import { darken, IconButton, lighten, useMediaQuery, useTheme } from "@mui/material";
import { store as questionStore } from "../../questions";
import { settingsStore } from "../../settings-store";
import { useSettingsStore } from "./useSettingsStore";

// ── Toggle Button ──────────────────────────────────────────────
export const ToggleSettingsButton = () => {
  const theme = useTheme();
  const s = useSettingsStore();
  const isSmall = useMediaQuery("(max-width:600px)");

  const bgcolor = s.panelOpen ? theme.palette.primary.main : theme.palette.background.paper;
  const hoverColor =
    theme.palette.mode === "light"
      ? s.panelOpen
        ? lighten(theme.palette.primary.main, 0.2)
        : darken(bgcolor, 0.2)
      : s.panelOpen
        ? darken(theme.palette.primary.main, 0.2)
        : lighten(bgcolor, 0.2);

  return (
    <IconButton
      onClick={() => {
        settingsStore.update({ panelOpen: !s.panelOpen });

        if (isSmall) {
          questionStore.update({ panelOpen: false });
        }
      }}
      sx={(theme) => ({
        bgcolor: bgcolor,
        boxShadow: 2,
        transition: theme.transitions.create("background-color"),
        "&:hover": {
          bgcolor: hoverColor,
        },
      })}
      aria-label="Toggle settings panel"
    >
      <SettingsIcon />
    </IconButton>
  );
};
