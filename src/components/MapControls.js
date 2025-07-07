import React from "react";
import { Box, Typography, Button, Paper, useTheme, useMediaQuery } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";

/**
 * Control panel for map actions
 * @param {Array} markers - Array of current markers
 * @param {Function} onClearAll - Callback to clear all markers
 */
function MapControls({ markers, onClearAll }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Paper elevation={1} sx={{ p: { xs: 1.5, md: 2 }, borderBottom: 1, borderColor: 'grey.200' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          Total markers: <Typography component="span" fontWeight="medium">{markers.length}</Typography>
        </Typography>
        <Button
          onClick={onClearAll}
          disabled={markers.length === 0}
          variant="contained"
          color="error"
          size={isMobile ? "small" : "small"}
          startIcon={<ClearIcon />}
          sx={{
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            px: { xs: 2, md: 3 },
            '&:disabled': {
              backgroundColor: 'grey.200',
              color: 'grey.400'
            }
          }}
        >
          {isMobile ? "Clear All" : "Clear All Markers"}
        </Button>
      </Box>
    </Paper>
  );
}

export default MapControls;
