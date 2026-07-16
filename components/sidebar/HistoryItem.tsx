import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";
import type { AskedQuestion } from "../../questions/types";

// ── History Item ───────────────────────────────────────────────
export const HistoryItem = ({ question }: { question: AskedQuestion }) => {
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
        sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: "action.hover" } }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
};
