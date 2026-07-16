import { Box, Button, MenuItem, Paper, Select, Typography } from "@mui/material";
import { thermometerQuestions } from "../../questions/data";
import { callbacks, store } from "../../questions/store";
import { useStore } from "./useStore";
import { usedThermometerDistances } from "./usedDistances";

// ── Thermometer Form ───────────────────────────────────────────
export const ThermometerForm = () => {
  const s = useStore();
  const used = usedThermometerDistances(s.history);

  const handleDistanceChange = (val: string) => {
    const num = Number(val);
    if (!Number.isNaN(num)) {
      store.update({ thermoDistance: num });
      callbacks.clearThermoMarkers();
      callbacks.startThermoPicking();
    }
  };

  const handleReset = () => {
    callbacks.clearThermoMarkers();
    callbacks.startThermoPicking();
  };

  const statusText = s.thermoStart
    ? s.thermoEnd
      ? "Both locations set. Choose answer:"
      : "Click the map to set your end location"
    : "Click the map to set your start location";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        Travel Distance
      </Typography>
      <Select
        size="small"
        fullWidth
        value={String(s.thermoDistance)}
        onChange={(e) => handleDistanceChange(e.target.value)}
      >
        {thermometerQuestions.map((q) => (
          <MenuItem key={q.distance} value={String(q.distance)} disabled={used.has(q.distance)}>
            {q.label}
            {q.gameSize === "small" ? "" : ` (${q.gameSize})`}
            {used.has(q.distance) ? " (used)" : ""}
          </MenuItem>
        ))}
      </Select>

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "action.hover" }}>
        <Typography variant="body2" color="text.secondary">
          {statusText}
        </Typography>
      </Paper>

      {(s.thermoStart || s.thermoEnd) && (
        <Button
          size="small"
          color="error"
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
          onClick={handleReset}
        >
          Reset locations
        </Button>
      )}

      {s.thermoStart && s.thermoEnd && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={() => callbacks.submitThermo("hotter")}
          >
            Hotter
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => callbacks.submitThermo("colder")}
          >
            Colder
          </Button>
        </Box>
      )}
    </Box>
  );
};
