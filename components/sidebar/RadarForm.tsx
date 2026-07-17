import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { callbacks, radarQuestions, roundCoord, store } from "../../questions";
import { GoogleMapsUrlField } from "./GoogleMapsUrlField";
import { useStore } from "./useStore";
import { usedRadarDistances } from "./usedDistances";

// ── Coordinate input helper ────────────────────────────────────
const CoordField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <TextField
    size="small"
    type="number"
    fullWidth
    placeholder={label}
    slotProps={{ htmlInput: { step: 0.0001 } }}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

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

  const handleLatChange = (val: string) => {
    store.update({ radarLat: val });
    const lat = Number(val);
    const lng = Number(s.radarLng);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    callbacks.setRadarCenter(lat, lng);
  };

  const handleLngChange = (val: string) => {
    store.update({ radarLng: val });
    const lat = Number(s.radarLat);
    const lng = Number(val);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    callbacks.setRadarCenter(lat, lng);
  };

  const statusText = s.radarCenter
    ? "Center set. Choose answer:"
    : "Click the map to set the radar center, or paste a Google Maps URL.";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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

      <Box sx={{ display: "flex", gap: 1 }}>
        <CoordField label="Lat" value={s.radarLat} onChange={handleLatChange} />
        <CoordField label="Lng" value={s.radarLng} onChange={handleLngChange} />
      </Box>

      <GoogleMapsUrlField
        onResolved={(lat, lng) => {
          store.update({ radarLat: String(roundCoord(lat)), radarLng: String(roundCoord(lng)) });
          callbacks.setRadarCenter(lat, lng);
        }}
      />

      {s.radarCenter && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          sx={{ textTransform: "none" }}
          onClick={handleReset}
        >
          Reset center
        </Button>
      )}

      {s.radarCenter && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            fullWidth
            variant="contained"
            color="success"
            onClick={() => callbacks.submitRadar("yes")}
          >
            Yes (in range)
          </Button>
          <Button
            size="small"
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
