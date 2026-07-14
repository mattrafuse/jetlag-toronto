import {
  HelpOutlined as HelpIcon,
  Radar as RadarIcon,
  Thermostat as ThermoIcon,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { radarQuestions, thermometerQuestions } from "./data";
import { callbacks, store } from "./store";
import type { AskedQuestion, AskedRadarQuestion, AskedThermometerQuestion } from "./types";

// ── Helpers ────────────────────────────────────────────────────
// Distances already used in the question history, so they can be
// disabled in the dropdowns to prevent re-using a size.
function usedRadarDistances(history: AskedQuestion[]): Set<number> {
  return new Set(
    history
      .filter((q): q is AskedRadarQuestion => q.type === "radar")
      .map((q) => q.distance),
  );
}
function usedThermometerDistances(history: AskedQuestion[]): Set<number> {
  return new Set(
    history
      .filter((q): q is AskedThermometerQuestion => q.type === "thermometer")
      .map((q) => q.distance),
  );
}

// ── Hook to subscribe to the store ─────────────────────────────
function useStore() {
  const [, setTick] = React.useState(0);
  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), []);
  return store.get();
}

// ── Toggle Button ──────────────────────────────────────────────
function TogglePanelButton() {
  const s = useStore();
  return (
    <IconButton
      onClick={() => store.update({ panelOpen: !s.panelOpen })}
      sx={(theme) => ({
        position: "absolute",
        top: 50,
        right: s.panelOpen ? theme.spacing(35) : theme.spacing(1),
        zIndex: 999,
        bgcolor: "background.paper",
        boxShadow: 2,
        transition: "right 0.3s ease",
        "&:hover": { bgcolor: "grey.100" },
      })}
      aria-label="Toggle questions panel"
    >
      <HelpIcon />
    </IconButton>
  );
}

// ── History Item ───────────────────────────────────────────────
function HistoryItem({ question }: { question: AskedQuestion }) {
  const desc =
    question.type === "radar"
      ? `Radar ${question.label}: ${question.answer.toUpperCase()}`
      : `Thermometer ${question.label}: ${question.answer.toUpperCase()}`;

  const handleDelete = () => {
    // Trigger via a custom event; sidebar.ts listens for this
    window.dispatchEvent(new CustomEvent("jetlag-remove-question", { detail: question.id }));
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 0.5,
        px: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Typography variant="caption" color="text.secondary">
        <span dangerouslySetInnerHTML={{ __html: desc }} />
      </Typography>
      <IconButton
        size="small"
        onClick={handleDelete}
        sx={{ color: "grey.400", "&:hover": { color: "error.main", bgcolor: "error.50" } }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

// ── Radar Form ─────────────────────────────────────────────────
function RadarForm() {
  const s = useStore();
  const used = usedRadarDistances(s.history);

  const handleDistanceChange = (val: string) => {
    const num = Number(val);
    if (val === "custom") {
      store.update({ radarUseCustom: true });
    } else if (!Number.isNaN(num)) {
      store.update({ radarDistance: num, radarUseCustom: false });
      callbacks.clearRadarMarker();
      callbacks.startRadarPicking();
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

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "grey.50" }}>
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
}

// ── Thermometer Form ───────────────────────────────────────────
function ThermometerForm() {
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

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "grey.50" }}>
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
}

// ── Main Sidebar Panel ─────────────────────────────────────────
export function SidebarPanel() {
  const s = useStore();

  const handleTabChange = (_: React.MouseEvent, newTab: "radar" | "thermometer") => {
    if (newTab) callbacks.switchTab(newTab);
  };

  return (
    <>
      <TogglePanelButton />

      <Paper
        elevation={8}
        sx={(theme) => ({
          position: "absolute",
          top: 0,
          right: s.panelOpen ? 0 : -330,
          width: theme.spacing(34),
          height: "100%",
          zIndex: 1000,
          borderRadius: 0,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginTop: "0 !important",
        })}
      >
        {/* Header */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ask a Question
          </Typography>
        </Box>

        {/* Tab Toggle */}
        <Box sx={{ px: 2, pb: 1 }}>
          <ToggleButtonGroup
            value={s.activeTab}
            exclusive
            onChange={handleTabChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="radar">
              <RadarIcon fontSize="small" sx={{ mr: 0.5 }} />
              Radar
            </ToggleButton>
            <ToggleButton value="thermometer">
              <ThermoIcon fontSize="small" sx={{ mr: 0.5 }} />
              Thermo
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Form Area */}
        <Box sx={{ px: 2, pb: 1 }}>
          {s.activeTab === "radar" ? <RadarForm /> : <ThermometerForm />}
        </Box>

        <Divider />

        {/* History */}
        <Box sx={{ px: 2, pt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color="text.secondary">
            Question History
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 0.5 }}>
          {s.history.length === 0 ? (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontStyle: "italic", px: 1, py: 1 }}
            >
              No questions asked yet
            </Typography>
          ) : (
            [...s.history].reverse().map((q) => <HistoryItem key={q.id} question={q} />)
          )}
        </Box>

        <Divider />

        {/* Settings */}
        <Box sx={{ px: 2, py: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={s.showRemoved}
                onChange={(e) => callbacks.setShowRemoved(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Show removed stations
              </Typography>
            }
          />
        </Box>
      </Paper>
    </>
  );
}
