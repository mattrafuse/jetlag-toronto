import { Settings as SettingsIcon } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Paper, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { settingsCallbacks, settingsStore } from "./settings-store";

// ── Hook to subscribe to the settings store ────────────────────
function useSettingsStore() {
  const [, setTick] = React.useState(0);
  useEffect(() => settingsStore.subscribe(() => setTick((n) => n + 1)), []);
  return settingsStore.get();
}

// ── Toggle Button ──────────────────────────────────────────────
function ToggleSettingsButton() {
  const s = useSettingsStore();
  return (
    <IconButton
      onClick={() => settingsStore.update({ panelOpen: !s.panelOpen })}
      sx={(theme) => ({
        position: "absolute",
        top: 10,
        right: s.panelOpen ? theme.spacing(35) : theme.spacing(1),
        zIndex: 999,
        bgcolor: "background.paper",
        boxShadow: 2,
        transition: "right 0.3s ease",
        "&:hover": { bgcolor: "grey.100" },
      })}
      aria-label="Toggle settings panel"
    >
      <SettingsIcon />
    </IconButton>
  );
}

// ── Settings Panel ─────────────────────────────────────────────
export function SettingsPanel() {
  const s = useSettingsStore();

  const layers = [
    { id: "chk-trains" as const, label: "GO Trains", key: "trains" as const },
    { id: "chk-subway" as const, label: "TTC Subway/LRT Lines", key: "subway" as const },
    { id: "chk-border" as const, label: "Border Mask", key: "border" as const },
    { id: "chk-location" as const, label: "My Location", key: "location" as const },
  ];

  return (
    <>
      <ToggleSettingsButton />

      <Paper
        elevation={8}
        sx={(theme) => ({
          position: "absolute",
          top: 0,
          right: s.panelOpen ? 0 : -270,
          width: theme.spacing(34),
          height: "100%",
          zIndex: 1000,
          borderRadius: 0,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: 6,
          px: 2,
          marginTop: "0 !important",
        })}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Map Settings
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {layers.map(({ id, label, key }) => (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  size="small"
                  checked={s[key]}
                  onChange={(e) => settingsCallbacks.toggleLayer(id, e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" color="text.primary">
                  {label}
                </Typography>
              }
            />
          ))}

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={s.darkMode}
                onChange={(e) => settingsCallbacks.toggleDarkMode(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" color="text.primary">
                Dark Mode
              </Typography>
            }
          />
        </Box>
      </Paper>
    </>
  );
}
