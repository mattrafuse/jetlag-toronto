import {
  CheckCircleOutlined as CheckedIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useQuestionsStore } from "./useQuestionsStore";

// ── Station List ───────────────────────────────────────────────
export const StationList = () => {
  const s = useQuestionsStore();

  if (s.stations.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic", py: 1 }}>
        No stations loaded
      </Typography>
    );
  }

  return (
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
            <UncheckedIcon fontSize="small" sx={{ color: "text.disabled", flexShrink: 0 }} />
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
  );
};
