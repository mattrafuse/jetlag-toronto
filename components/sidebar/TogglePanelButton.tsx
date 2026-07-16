import { HelpOutlined as HelpIcon } from "@mui/icons-material";
import { darken, IconButton, lighten } from "@mui/material";
import { store } from "../../questions/store";
import { useStore } from "./useStore";

// ── Toggle Button ──────────────────────────────────────────────
export const TogglePanelButton = () => {
  const s = useStore();
  return (
    <IconButton
      onClick={() => store.update({ panelOpen: !s.panelOpen })}
      sx={(theme) => ({
        bgcolor: "background.paper",
        boxShadow: 2,
        transition: theme.transitions.create("background-color"),
        "&:hover": {
          bgcolor:
            theme.palette.mode === "light"
              ? darken(theme.palette.background.paper, 0.2)
              : lighten(theme.palette.background.paper, 0.2),
        },
      })}
      aria-label="Toggle questions panel"
    >
      <HelpIcon />
    </IconButton>
  );
};
