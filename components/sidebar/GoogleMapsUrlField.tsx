import { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

interface GoogleMapsUrlFieldProps {
  label: string;
  onResolved: (lat: number, lng: number) => void;
}

/**
 * Lets the user paste a Google Maps URL (e.g. a maps.app.goo.gl short link)
 * and resolve it to a lat/lng via the backend `/api/resolve` endpoint.
 * On success, `onResolved` is called with the coordinates.
 */
export const GoogleMapsUrlField = ({ label, onResolved }: GoogleMapsUrlFieldProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to resolve (status ${res.status})`);
      }
      const data = (await res.json()) as { lat: number; lng: number };
      if (typeof data.lat !== "number" || typeof data.lng !== "number") {
        throw new Error("Resolved location is missing coordinates");
      }
      onResolved(data.lat, data.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Google Maps URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleResolve();
          }}
        />
        <Button
          size="small"
          variant="contained"
          onClick={handleResolve}
          disabled={loading || !url.trim()}
          sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        >
          {loading ? <CircularProgress size={16} /> : "Set"}
        </Button>
      </Box>
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};
