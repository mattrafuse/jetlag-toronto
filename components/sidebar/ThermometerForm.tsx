import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import {
  questionsCallbacks,
  questionsStore,
  roundCoord,
  thermometerQuestions,
} from "../../questions";
import { GoogleMapsUrlField } from "./GoogleMapsUrlField";
import { useQuestionsStore } from "./useQuestionsStore";
import { usedThermometerDistances } from "./usedDistances";

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

// ── Thermometer Form ───────────────────────────────────────────
export const ThermometerForm = () => {
  const s = useQuestionsStore();
  const used = usedThermometerDistances(s.history);

  const handleDistanceChange = (val: string) => {
    const num = Number(val);
    if (!Number.isNaN(num)) {
      questionsStore.update({ thermoDistance: num });
      questionsCallbacks.clearThermoMarkers();
      questionsCallbacks.startThermoPicking();
    }
  };

  const handleReset = () => {
    questionsCallbacks.clearThermoMarkers();
    questionsCallbacks.startThermoPicking();
  };

  const handleStartLatChange = (val: string) => {
    questionsStore.update({ thermoStartLat: val });
    const lat = Number(val);
    const lng = Number(s.thermoStartLng);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    questionsCallbacks.setThermoStart(lat, lng);
  };

  const handleStartLngChange = (val: string) => {
    questionsStore.update({ thermoStartLng: val });
    const lat = Number(s.thermoStartLat);
    const lng = Number(val);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    questionsCallbacks.setThermoStart(lat, lng);
  };

  const handleEndLatChange = (val: string) => {
    questionsStore.update({ thermoEndLat: val });
    const lat = Number(val);
    const lng = Number(s.thermoEndLng);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    questionsCallbacks.setThermoEnd(lat, lng);
  };

  const handleEndLngChange = (val: string) => {
    questionsStore.update({ thermoEndLng: val });
    const lat = Number(s.thermoEndLat);
    const lng = Number(val);
    if (!val || Number.isNaN(lat) || Number.isNaN(lng)) return;
    questionsCallbacks.setThermoEnd(lat, lng);
  };

  const statusText = s.thermoStart
    ? s.thermoEnd
      ? "Both locations set. Choose answer:"
      : "Click the map to set your end location"
    : "Click the map to set your start location";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Start
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <CoordField label="Lat" value={s.thermoStartLat} onChange={handleStartLatChange} />
          <CoordField label="Lng" value={s.thermoStartLng} onChange={handleStartLngChange} />
        </Box>
        <GoogleMapsUrlField
          label="Or paste a Google Maps URL to set the start"
          onResolved={(lat, lng) => {
            questionsStore.update({
              thermoStartLat: String(roundCoord(lat)),
              thermoStartLng: String(roundCoord(lng)),
            });
            questionsCallbacks.setThermoStart(lat, lng);
          }}
        />
        <Typography variant="caption" color="text.secondary">
          End
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <CoordField label="Lat" value={s.thermoEndLat} onChange={handleEndLatChange} />
          <CoordField label="Lng" value={s.thermoEndLng} onChange={handleEndLngChange} />
        </Box>
        <GoogleMapsUrlField
          label="Or paste a Google Maps URL to set the end"
          onResolved={(lat, lng) => {
            questionsStore.update({
              thermoEndLat: String(roundCoord(lat)),
              thermoEndLng: String(roundCoord(lng)),
            });
            questionsCallbacks.setThermoEnd(lat, lng);
          }}
        />
      </Box>

      {(s.thermoStart || s.thermoEnd) && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
          onClick={handleReset}
        >
          Reset locations
        </Button>
      )}

      {s.thermoStart && s.thermoEnd && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            fullWidth
            variant="contained"
            color="success"
            onClick={() => questionsCallbacks.submitThermo("hotter")}
          >
            Hotter
          </Button>
          <Button
            size="small"
            fullWidth
            variant="contained"
            color="error"
            onClick={() => questionsCallbacks.submitThermo("colder")}
          >
            Colder
          </Button>
        </Box>
      )}
    </Box>
  );
};
