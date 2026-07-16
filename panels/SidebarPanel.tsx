import { Radar as RadarIcon, Thermostat as ThermoIcon } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React from "react";
import { HistoryItem } from "../components/sidebar/HistoryItem";
import { RadarForm } from "../components/sidebar/RadarForm";
import { StationList } from "../components/sidebar/StationList";
import { ThermometerForm } from "../components/sidebar/ThermometerForm";
import { useStore } from "../components/sidebar/useStore";
import { callbacks } from "../questions/store";

// ── Main Sidebar Panel ─────────────────────────────────────────
export const SidebarPanel = () => {
  const s = useStore();

  const handleTabChange = (_: React.MouseEvent, newTab: "radar" | "thermometer") => {
    if (newTab) callbacks.switchTab(newTab);
  };

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
          marginTop: "0 !important",
        }}
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

        {/* Station list */}
        <Box sx={{ px: 2, pt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color="text.secondary">
            Stations
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", maxHeight: 200 }}>
          <StationList />
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
    </Collapse>
  );
};
