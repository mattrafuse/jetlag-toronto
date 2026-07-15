import { MyLocation as MyLocationIcon, Settings as SettingsIcon } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Collapse,
  darken,
  FormControlLabel,
  IconButton,
  lighten,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { focusUserLocation, onLocationAvailabilityChange } from "./layers/location";
import { settingsCallbacks, settingsStore } from "./settings-store";

// ── Hook to subscribe to the settings store ────────────────────
const useSettingsStore = () => {
  const [, setTick] = React.useState(0);
  useEffect(() => settingsStore.subscribe(() => setTick((n) => n + 1)), []);
  return settingsStore.get();
};

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

// ── Locate Button ─────────────────────────────────────────────
export const LocateButton = () => {
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => onLocationAvailabilityChange(setAvailable), []);

  if (!available) return null;

  return (
    <IconButton
      onClick={() => focusUserLocation()}
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
      aria-label="Focus on my location"
    >
      <MyLocationIcon />
    </IconButton>
  );
};

// ── Settings Panel ─────────────────────────────────────────────
export const SettingsPanel = () => {
  const s = useSettingsStore();

  const layers = [
    { id: "chk-trains" as const, label: "GO Trains", key: "trains" as const },
    { id: "chk-subway" as const, label: "TTC Subway/LRT Lines", key: "subway" as const },
    { id: "chk-border" as const, label: "Border Mask", key: "border" as const },
    { id: "chk-location" as const, label: "My Location", key: "location" as const },
  ];

  return (
    <Collapse in={s.panelOpen} orientation="horizontal">
      <Paper
        elevation={8}
        sx={{
          height: "100%",
          borderRadius: 0,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          p: 2,
          marginTop: "0 !important",
        }}
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

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={s.stationLabels}
                onChange={(e) => settingsCallbacks.toggleStationLabels(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" color="text.primary">
                Show Station Labels
              </Typography>
            }
          />
        </Box>
      </Paper>
    </Collapse>
  );
};
