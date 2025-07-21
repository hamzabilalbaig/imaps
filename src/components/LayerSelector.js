import React, { useState } from "react";
import {
  Box,
  Paper,
  Button,
  ButtonGroup,
  Typography,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import {
  Check as CheckIcon,
  Layers as LayersIcon
} from "@mui/icons-material";
import { useMapLayers } from "../hooks/useMapLayers";

/**
 * Component for quick layer selection on the map - now shows as buttons in bottom center
 */
function LayerSelector({ position = "bottom-center", showInPublic = true, isAdmin = false }) {
  const { layers, activeLayer, setActiveLayer } = useMapLayers();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!showInPublic && !isAdmin) {
    return null;
  }

  const positionClasses = {
    "top-right": { top: { xs: 8, md: 16 }, right: { xs: 8, md: 16 } },
    "top-left": { top: { xs: 8, md: 16 }, left: { xs: 8, md: 16 } },
    "bottom-right": { bottom: { xs: 80, md: 16 }, right: { xs: 8, md: 16 } },
    "bottom-left": { bottom: { xs: 80, md: 16 }, left: { xs: 8, md: 16 } },
    "bottom-center": { 
      bottom: { xs: 80, md: 16 }, 
      left: "50%", 
      transform: "translateX(-50%)" 
    },
  };

  const handleLayerChange = (layerId) => {
    // Set the new layer
    setActiveLayer(layerId);
    
    // Reload the page to ensure the new image loads properly
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positionClasses[position],
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <ButtonGroup 
          variant="contained" 
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiButton-root': {
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              minWidth: { xs: 60, md: 80 },
              transition: 'all 0.2s ease-in-out',
              '&:not(.active)': {
                backgroundColor: alpha(theme.palette.grey[100], 0.8),
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  transform: 'translateY(-1px)'
                }
              },
              '&.active': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-1px)'
                }
              }
            }
          }}
        >
          {layers.map((layer) => (
            <Button
              key={layer.id}
              onClick={() => handleLayerChange(layer.id)}
              className={layer.isActive ? 'active' : ''}
              startIcon={layer.isActive ? <CheckIcon sx={{ fontSize: '1rem' }} /> : null}
            >
              {layer.name}
            </Button>
          ))}
        </ButtonGroup>
      </Paper>
    </Box>
  );
}

export default LayerSelector;