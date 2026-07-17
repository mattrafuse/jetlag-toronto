import { MyLocation as MyLocationIcon } from "@mui/icons-material";
import { darken, IconButton, lighten } from "@mui/material";
import React from "react";
import { focusUserLocation, onLocationAvailabilityChange } from "layers/location";

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
