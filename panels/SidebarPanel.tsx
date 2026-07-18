import {
  ShapeLine as PolygonIcon,
  Radar as RadarIcon,
  Thermostat as ThermoIcon,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React from "react";
import { HistoryItem } from "components/sidebar/HistoryItem";
import { PolygonForm } from "components/sidebar/PolygonForm";
import { RadarForm } from "components/sidebar/RadarForm";
import { StationList } from "components/sidebar/StationList";
import { ThermometerForm } from "components/sidebar/ThermometerForm";
import { useQuestionsStore } from "components/sidebar/useQuestionsStore";
import { questionsCallbacks } from "questions";

// ── Main Sidebar Panel ─────────────────────────────────────────
export const SidebarPanel = () => {
  const s = useQuestionsStore();
  const isSmall = useMediaQuery("(max-width:600px)");

  const handleTabChange = (_: React.MouseEvent, newTab: "radar" | "thermometer" | "polygon") => {
    if (newTab) questionsCallbacks.switchTab(newTab);
  };

  return (
    <Collapse in={s.panelOpen} orientation={isSmall ? "vertical" : "horizontal"}>
      <Paper
        elevation={8}
        sx={[
          (theme) =>
            isSmall
              ? { maxHeight: "50vh", overflow: "auto" }
              : {
                  height: "100%",
                  transition: theme.transitions.create("right"),
                  width: "400px",
                  overflow: "hidden",
                },
          {
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",

            p: 2,
            marginTop: "0 !important",
          },
        ]}
      >
        {/* Header */}
        <Box sx={{ pt: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ask a Question
          </Typography>
        </Box>

        {/* Tab Toggle */}
        <Box sx={{ pb: 1 }}>
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
            <ToggleButton value="polygon">
              <PolygonIcon fontSize="small" sx={{ mr: 0.5 }} />
              Polygon
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Form Area */}
        <Box sx={{ pb: 1 }}>
          {s.activeTab === "radar" ? (
            <RadarForm />
          ) : s.activeTab === "polygon" ? (
            <PolygonForm />
          ) : (
            <ThermometerForm />
          )}
        </Box>

        <Divider />

        {/* History */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, pt: 1 }} color="text.secondary">
          Question History
        </Typography>
        <Box sx={[!isSmall && { flex: 1, overflow: "auto", py: 1 }]}>
          {s.history.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic", py: 1 }}>
              No questions asked yet
            </Typography>
          ) : (
            [...s.history].reverse().map((q) => <HistoryItem key={q.id} question={q} />)
          )}
        </Box>

        <Divider />

        <StationList />
      </Paper>
    </Collapse>
  );
};
