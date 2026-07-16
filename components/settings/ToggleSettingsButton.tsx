import { Settings as SettingsIcon } from "@mui/icons-material";
import { darken, IconButton, lighten } from "@mui/material";
import { settingsStore } from "../../settings-store";
import { useSettingsStore } from "./useSettingsStore";

// ── Toggle Button ──────────────────────────────────────────────
export const ToggleSettingsButton = () => {
  const s = useSettingsStore();
  return (
    <IconButton
      onClick={() => settingsStore.update({ panelOpen: !s.panelOpen })}
      sx={(theme) => ({
        bgcolor: "background.paper",
        boxShadow: 2,
        transition: theme.transitions.create("background-color"),
        "&:hover": {
          bgcolor:
            theme.palette.mode === "light"
              ? darken(theme.palette.background.paper, 0.2)
              : lighten(theme.palette.background.paper, 0.2),
        },
      })}
      aria-label="Toggle settings panel"
    >
      <SettingsIcon />
    </IconButton>
  );
};
