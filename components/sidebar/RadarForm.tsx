import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { questionsCallbacks, questionsStore, radarQuestions, roundCoord } from "questions";
import { GoogleMapsUrlField } from "./GoogleMapsUrlField";
import { useQuestionsStore } from "./useQuestionsStore";
import { usedRadarDistances } from "./usedDistances";
import { validateCoordinates } from "./coordUtils";
import capitalize from "lodash-es/capitalize";

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
  const s = useQuestionsStore();
  const used = usedRadarDistances(s.history);

  const handleDistanceChange = (val: string) => {
    const num = Number(val);
    if (val === "custom") {
      questionsStore.update({ radarUseCustom: true });
    } else if (!Number.isNaN(num)) {
      questionsStore.update({ radarDistance: num, radarUseCustom: false });
      // If a radar center is already placed, just update the radius preview
      // in place; otherwise restart picking from scratch.
      if (!s.radarCenter) {
        questionsCallbacks.clearRadarMarker();
        questionsCallbacks.startRadarPicking();
      }
    }
  };

  const handleCustomChange = (val: string) => {
    const num = Number(val);
    if (!Number.isNaN(num) && num > 0) {
      questionsStore.update({ radarCustomDistance: num });
    }
  };

  const handleReset = () => {
    questionsCallbacks.clearRadarMarker();
    questionsCallbacks.startRadarPicking();
  };

  // Each coordinate field updates its own store value, then applies the pair
  // to the map once both lat and lng are present and valid. The sibling field
  // (lat<->lng) is read from the store.
  const handleCoordChange = (field: "lat" | "lng", val: string) => {
    questionsStore.update({ [`radar${capitalize(field)}`]: val });
    const isLat = field === "lat";
    const sibling = isLat ? "radarLng" : "radarLat";
    const latStr = isLat ? val : s[sibling];
    const lngStr = isLat ? s[sibling] : val;

    if (!validateCoordinates(latStr, lngStr)) {
      return;
    }

    questionsCallbacks.setRadarCenter(Number(latStr), Number(lngStr));
  };

  const selectedDistance = s.radarUseCustom ? s.radarCustomDistance : s.radarDistance;
  const selectedUsed = used.has(selectedDistance);

  const statusText = selectedUsed
    ? "This radius has already been used. Change the radius to place another radar."
    : s.radarCenter
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
        <CoordField
          label="Lat"
          value={s.radarLat}
          onChange={(val) => handleCoordChange("lat", val)}
        />
        <CoordField
          label="Lng"
          value={s.radarLng}
          onChange={(val) => handleCoordChange("lng", val)}
        />
      </Box>

      <GoogleMapsUrlField
        onResolved={(lat, lng) => {
          questionsStore.update({
            radarLat: String(roundCoord(lat)),
            radarLng: String(roundCoord(lng)),
          });
          questionsCallbacks.setRadarCenter(lat, lng);
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
            disabled={used.has(s.radarUseCustom ? s.radarCustomDistance : s.radarDistance)}
            onClick={() => questionsCallbacks.submitRadar("yes")}
          >
            Yes (in range)
          </Button>
          <Button
            size="small"
            fullWidth
            variant="contained"
            color="error"
            disabled={used.has(s.radarUseCustom ? s.radarCustomDistance : s.radarDistance)}
            onClick={() => questionsCallbacks.submitRadar("no")}
          >
            No (out of range)
          </Button>
        </Box>
      )}
    </Box>
  );
};
