import CloseIcon from "@mui/icons-material/Close";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import type { AskedQuestion } from "../../questions";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number): string => n.toFixed(4);

const coordLabel = (lat: number, lng: number): string => `${fmt(lat)}, ${fmt(lng)}`;

const answerColor = (answer: AskedQuestion["answer"]): "success" | "error" | "warning" | "info" => {
  switch (answer) {
    case "yes":
      return "success";
    case "no":
      return "error";
    case "hotter":
      return "error";
    case "colder":
      return "info";
  }
};

// ── History Item ───────────────────────────────────────────────
export const HistoryItem = ({ question }: { question: AskedQuestion }) => {
  const isRadar = question.type === "radar";
  const title = `${isRadar ? "Radar" : "Thermometer"} ${question.label}`;
  const answerText = question.answer.toUpperCase();

  const handleDelete = () => {
    // Trigger via a custom event; sidebar.ts listens for this
    window.dispatchEvent(new CustomEvent("jetlag-remove-question", { detail: question.id }));
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderLeft: "4px solid",
        borderLeftColor: `${answerColor(question.answer)}.main`,
        borderRadius: 1,
        p: 1,
        mb: 1,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Chip
            label={answerText}
            size="small"
            color={answerColor(question.answer)}
            variant="outlined"
          />
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              color: "text.disabled",
              "&:hover": { color: "error.main", bgcolor: "action.hover" },
            }}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mt: 0.5 }}>
        {isRadar ? (
          <Typography variant="caption" color="text.secondary" component="div">
            <strong>Center:</strong> {coordLabel(question.center[0], question.center[1])}
          </Typography>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Start:</strong> {coordLabel(question.start[0], question.start[1])}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>End:</strong> {coordLabel(question.end[0], question.end[1])}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
