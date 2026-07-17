import {
  CheckCircleOutlined as CheckedIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useQuestionsStore } from "./useQuestionsStore";
import { questionsCallbacks } from "questions";

// ── Station List ───────────────────────────────────────────────
export const StationList = () => {
  const s = useQuestionsStore();
  const isSmall = useMediaQuery("(max-width:600px)");

  return (
    <>
      {s.stations.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic", py: 1 }}>
          No stations loaded
        </Typography>
      ) : (
        <>
          <Stack
            sx={{ pt: 1, alignItems: "center", justifyContent: "space-between" }}
            direction="row"
            spacing={1}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color="text.secondary">
              Stations
            </Typography>

            <Typography variant="caption">
              {s.stations.filter((st) => !st.excluded).length} / {s.stations.length} Remaining
            </Typography>
          </Stack>
          <Box
            sx={
              isSmall ? { flexGrow: 1, py: 1 } : { flex: 1, overflow: "auto", maxHeight: "300px" }
            }
          >
            <Box sx={{ py: 0.5 }}>
              {s.stations.map((st) => (
                <Box
                  key={st.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.25,
                    px: 1,
                  }}
                >
                  {st.excluded ? (
                    <CheckedIcon fontSize="small" sx={{ color: "success.main", flexShrink: 0 }} />
                  ) : (
                    <UncheckedIcon
                      fontSize="small"
                      sx={{ color: "text.disabled", flexShrink: 0 }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      textDecoration: st.excluded ? "line-through" : "none",
                      color: st.excluded ? "text.disabled" : "text.primary",
                    }}
                  >
                    {st.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider />
        </>
      )}

      {/* Settings */}
      <Box sx={{ py: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={s.showRemoved}
              onChange={(e) => questionsCallbacks.setShowRemoved(e.target.checked)}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Show removed stations
            </Typography>
          }
        />
      </Box>
    </>
  );
};
