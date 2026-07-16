import {
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  Paper,
  Typography,
} from "@mui/material";
import { useSettingsStore } from "../components/settings/useSettingsStore";
import { settingsCallbacks } from "../settings-store";

// ── Settings Panel ─────────────────────────────────────────────
export const SettingsPanel = () => {
  const s = useSettingsStore();

  const layers = [
    { id: "chk-trains" as const, label: "GO Trains", key: "trains" as const },
    { id: "chk-subway" as const, label: "TTC Subway/LRT Lines", key: "subway" as const },
    { id: "chk-border" as const, label: "Border Mask", key: "border" as const },
    { id: "chk-location" as const, label: "My Location", key: "location" as const },
  ];

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
          p: 2,
          marginTop: "0 !important",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Map Settings
        </Typography>
        {layers.map(({ id, label, key }) => (
          <FormControlLabel
            key={id}
            control={
              <Checkbox
                size="small"
                checked={s[key]}
                onChange={(e) => settingsCallbacks.toggleLayer(id, e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" color="text.primary">
                {label}
              </Typography>
            }
          />
        ))}

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={s.darkMode}
              onChange={(e) => settingsCallbacks.toggleDarkMode(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.primary">
              Dark Mode
            </Typography>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={s.stationLabels}
              onChange={(e) => settingsCallbacks.toggleStationLabels(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.primary">
              Show Station Labels
            </Typography>
          }
        />
        <div style={{ flex: 1 }} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Developer Settings
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={s.borderEditable}
              onChange={(e) => settingsCallbacks.toggleBorderEditable(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.primary">
              Edit Border
            </Typography>
          }
        />

        <Button
          size="small"
          variant="outlined"
          sx={{ alignSelf: "flex-start", mt: 0.5 }}
          onClick={() => settingsCallbacks.exportBorder()}
        >
          Export Border GeoJSON
        </Button>
      </Paper>
    </Collapse>
  );
};
