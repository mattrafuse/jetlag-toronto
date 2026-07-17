import { ShapeLine as PolygonIcon } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
import { questionsCallbacks } from "questions";
import { useQuestionsStore } from "./useQuestionsStore";

// ── Custom Polygon Form ──────────────────────────────────────
export const PolygonForm = () => {
  const s = useQuestionsStore();

  const handleDraw = () => {
    questionsCallbacks.clearPolygon();
    questionsCallbacks.startPolygonPicking();
  };

  const handleReset = () => {
    questionsCallbacks.clearPolygon();
  };

  const statusText = s.polygonDrawn
    ? "Polygon drawn. Drag the vertices to adjust it, then choose your answer:"
    : s.polygonDrawing
      ? "Click the map to place vertices. When done, click “Finish Polygon” or double-click the last vertex."
      : "Click “Draw Polygon”, then click the map to place vertices. Double-click to close the shape.";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Button
        size="small"
        variant="contained"
        startIcon={<PolygonIcon fontSize="small" />}
        onClick={handleDraw}
        sx={{ textTransform: "none" }}
      >
        Draw Polygon
      </Button>

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "action.hover" }}>
        <Typography variant="body2" color="text.secondary">
          {statusText}
        </Typography>
      </Paper>

      {s.polygonDrawing && (
        <Button
          size="small"
          variant="contained"
          color="warning"
          onClick={() => questionsCallbacks.finishPolygonDrawing()}
          sx={{ textTransform: "none" }}
        >
          Finish Polygon
        </Button>
      )}

      {s.polygonDrawn && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          sx={{ textTransform: "none" }}
          onClick={handleReset}
        >
          Clear polygon
        </Button>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          disabled={!s.polygonDrawn}
          onClick={() => questionsCallbacks.submitPolygon("yes")}
          sx={{ textTransform: "none" }}
        >
          Hider is inside
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          disabled={!s.polygonDrawn}
          onClick={() => questionsCallbacks.submitPolygon("no")}
          sx={{ textTransform: "none" }}
        >
          Hider is outside
        </Button>
      </Box>
    </Box>
  );
};
