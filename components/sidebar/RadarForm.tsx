import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { radarQuestions } from "../../questions/data";
import { callbacks, store } from "../../questions/store";
import { useStore } from "./useStore";
import { usedRadarDistances } from "./usedDistances";

// ── Radar Form ─────────────────────────────────────────────────
export const RadarForm = () => {
  const s = useStore();
  const used = usedRadarDistances(s.history);

  const handleDistanceChange = (val: string) => {
    const num = Number(val);
    if (val === "custom") {
      store.update({ radarUseCustom: true });
    } else if (!Number.isNaN(num)) {
      store.update({ radarDistance: num, radarUseCustom: false });
      // If a radar center is already placed, just update the radius preview
      // in place; otherwise restart picking from scratch.
      if (!s.radarCenter) {
        callbacks.clearRadarMarker();
        callbacks.startRadarPicking();
      }
    }
  };

  const handleCustomChange = (val: string) => {
    const num = Number(val);
    if (!Number.isNaN(num) && num > 0) {
      store.update({ radarCustomDistance: num });
    }
  };

  const handleReset = () => {
    callbacks.clearRadarMarker();
    callbacks.startRadarPicking();
  };

  const statusText = s.radarCenter
    ? "Center set. Choose answer:"
    : "Click the map to set the radar center";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        Distance
      </Typography>
      <Select
        size="small"
        fullWidth
        value={s.radarUseCustom ? "custom" : String(s.radarDistance)}
        onChange={(e) => handleDistanceChange(e.target.value)}
      >
        {radarQuestions.map((q) => (
          <MenuItem key={q.distance} value={String(q.distance)} disabled={used.has(q.distance)}>
            {q.label}
            {used.has(q.distance) ? " (used)" : ""}
          </MenuItem>
        ))}
        <MenuItem value="custom">Custom…</MenuItem>
      </Select>

      {s.radarUseCustom && (
        <TextField
          size="small"
          type="number"
          fullWidth
          placeholder="Enter miles…"
          slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
          value={s.radarCustomDistance || ""}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
      )}

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "action.hover" }}>
        <Typography variant="body2" color="text.secondary">
          {statusText}
        </Typography>
      </Paper>

      {s.radarCenter && (
        <Button
          size="small"
          color="error"
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
          onClick={handleReset}
        >
          Reset center
        </Button>
      )}

      {s.radarCenter && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={() => callbacks.submitRadar("yes")}
          >
            Yes (in range)
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => callbacks.submitRadar("no")}
          >
            No (out of range)
          </Button>
        </Box>
      )}
    </Box>
  );
};
