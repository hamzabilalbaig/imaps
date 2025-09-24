import React, { useState, useCallback, useRef } from "react";
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
import { saveMapState } from "../utils/mapStateUtils";
import { debounce } from "../utils/debounce";

/**
 * Component for quick layer selection on the map - now shows as buttons in bottom center
 */
function LayerSelector({ position = "bottom-center", showInPublic = true, isAdmin = false }) {
  const { layers, activeLayer, setActiveLayer } = useMapLayers();
  const [isChangingLayer, setIsChangingLayer] = useState(false);
  const debouncedLayerChangeRef = useRef(null);



  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Simplified layer change function with timeout
  const performLayerChange = useCallback((layerId, preservedCenter, preservedZoom) => {
    try {
      console.log('Performing layer change to:', layerId);
      
      // Set the new layer immediately
      setActiveLayer(layerId);
      
      // Use requestAnimationFrame to ensure the layer change is processed first
      requestAnimationFrame(() => {
        try {
          const map = window.leafletMap;
          if (map && map._container && map._loaded) {
            // Force map refresh once
            map.invalidateSize({ animate: false });
            
            // Restore view state if available
            if (preservedCenter && preservedZoom !== undefined) {
              map.setView(preservedCenter, preservedZoom, { animate: false });
            }
          }
        } catch (err) {
          console.warn('Map refresh after layer change failed', err);
        }
      });
      
      // Reset the changing state after a short delay
      setTimeout(() => {
        console.log('Resetting isChangingLayer state');
        setIsChangingLayer(false);
      }, 300);
      
    } catch (err) {
      console.error('Layer change error:', err);
      setIsChangingLayer(false);
    }
  }, [setActiveLayer]);

  // Create debounced version
  const debouncedLayerChange = useCallback(
    debounce(performLayerChange, 150), // 150ms debounce
    [performLayerChange]
  );

  // Store the debounced function in ref
  React.useEffect(() => {
    debouncedLayerChangeRef.current = debouncedLayerChange;
  }, [debouncedLayerChange]);

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
    // Prevent multiple rapid clicks
    if (isChangingLayer) {
      console.log('Layer change already in progress, ignoring click');
      return;
    }

    console.log('Starting layer change to:', layerId);
    setIsChangingLayer(true);
    
    // Failsafe timeout to reset state - this ensures the button always gets re-enabled
    const failsafeTimeout = setTimeout(() => {
      console.log('Failsafe timeout triggered, resetting isChangingLayer');
      setIsChangingLayer(false);
    }, 1500); // 1.5 second failsafe
    
    // Save current map state before changing layer
    if (window.leafletMap) {
      saveMapState(window.leafletMap);
    }
    
    // Preserve current view state
    let center, zoom;
    try {
      if (window.leafletMap && window.leafletMap._loaded) {
        center = window.leafletMap.getCenter();
        zoom = window.leafletMap.getZoom();
      }
    } catch (e) {
      // ignore
    }
    
    // Call debounced layer change
    try {
      debouncedLayerChange(layerId, center, zoom);
    } catch (err) {
      console.error('Error calling debounced layer change:', err);
      clearTimeout(failsafeTimeout);
      setIsChangingLayer(false);
    }
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
              '&:disabled': {
                opacity: 0.6,
                cursor: 'not-allowed',
                '&:hover': {
                  transform: 'none'
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
              disabled={isChangingLayer}
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