import {
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as turf from "@turf/turf";
import { questionsCallbacks, questionsStore, roundCoord, thermometerQuestions } from "questions";
import { GoogleMapsUrlField } from "./GoogleMapsUrlField";
import { useQuestionsStore } from "./useQuestionsStore";
import { usedThermometerDistances } from "./usedDistances";
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

  // Each coordinate field updates its own store value, then applies the pair
  // to the map once both lat and lng are present and valid. The sibling field
  // (lat<->lng) is read from the store.
  const handleCoordChange = (field: "start" | "end", direction: "lat" | "lng", val: string) => {
    const key = `thermo${capitalize(field)}${capitalize(direction)}}`;
    questionsStore.update({ [key]: val });
    const isLat = key.endsWith("Lat");
    const sibling = (isLat ? key.replace("Lat", "Lng") : key.replace("Lng", "Lat")) as
      | "thermoStartLat"
      | "thermoStartLng"
      | "thermoEndLat"
      | "thermoEndLng";

    const latStr = isLat ? val : s[sibling];
    const lngStr = isLat ? s[sibling] : val;

    if (!validateCoordinates(latStr, lngStr)) {
      return;
    }

    if (field === "start") {
      questionsCallbacks.setThermoStart(Number(latStr), Number(lngStr));
    } else {
      questionsCallbacks.setThermoEnd(Number(latStr), Number(lngStr));
    }
  };

  const statusText = s.thermoStart
    ? s.thermoEnd
      ? "Both locations set. Choose answer:"
      : "Click the map to set your end location"
    : "Click the map to set your start location";

  // Distance between the start and end points (in miles), and whether
  // it satisfies the minimum travel distance for the chosen thermometer.
  const travelDistance =
    s.thermoStart && s.thermoEnd
      ? turf.distance(s.thermoStart, s.thermoEnd, { units: "miles" })
      : null;
  const distanceValid = travelDistance !== null && travelDistance >= s.thermoDistance;

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

      {travelDistance !== null && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            bgcolor: distanceValid ? "action.hover" : "error.light",
            color: distanceValid ? "text.secondary" : "error.contrastText",
          }}
        >
          <Typography variant="body2">
            Distance traveled: {travelDistance.toFixed(4)} mi
            {distanceValid ? "" : ` — must be at least ${s.thermoDistance} mi for this thermometer`}
          </Typography>
        </Paper>
      )}
      <Stack spacing={1} sx={{ position: "relative", pl: 2 }}>
        <Typography
          color="primary"
          sx={(theme) => ({
            fontWeight: 600,
            position: "absolute",
            transform: "rotate(-90deg) translatex(10%)",
            left: theme.spacing(-4),
            top: "50%",
          })}
        >
          S T A R T
        </Typography>
        <Stack direction="row" spacing={1}>
          <CoordField
            label="Lat"
            value={s.thermoStartLat}
            onChange={(val) => handleCoordChange("start", "lat", val)}
          />
          <CoordField
            label="Lng"
            value={s.thermoStartLng}
            onChange={(val) => handleCoordChange("start", "lng", val)}
          />
        </Stack>
        <GoogleMapsUrlField
          onResolved={(lat, lng) => {
            questionsStore.update({
              thermoStartLat: String(roundCoord(lat)),
              thermoStartLng: String(roundCoord(lng)),
            });
            questionsCallbacks.setThermoStart(lat, lng);
          }}
        />
      </Stack>
      <Divider flexItem />
      <Stack spacing={1} sx={{ position: "relative", pl: 2 }}>
        <Typography
          color="error"
          sx={{
            fontWeight: 600,
            position: "absolute",
            transform: "rotate(-90deg) translatex(15%)",
            left: "-18px",
            top: "50%",
          }}
        >
          E N D
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <CoordField
            label="Lat"
            value={s.thermoEndLat}
            onChange={(val) => handleCoordChange("end", "lat", val)}
          />
          <CoordField
            label="Lng"
            value={s.thermoEndLng}
            onChange={(val) => handleCoordChange("end", "lng", val)}
          />
        </Box>

        <GoogleMapsUrlField
          onResolved={(lat, lng) => {
            questionsStore.update({
              thermoEndLat: String(roundCoord(lat)),
              thermoEndLng: String(roundCoord(lng)),
            });
            questionsCallbacks.setThermoEnd(lat, lng);
          }}
        />
      </Stack>

      {(s.thermoStart || s.thermoEnd) && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          sx={{ textTransform: "none" }}
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
            disabled={!distanceValid}
            onClick={() => questionsCallbacks.submitThermo("hotter")}
          >
            Hotter
          </Button>
          <Button
            size="small"
            fullWidth
            variant="contained"
            color="error"
            disabled={!distanceValid}
            onClick={() => questionsCallbacks.submitThermo("colder")}
          >
            Colder
          </Button>
        </Box>
      )}
    </Box>
  );
};
