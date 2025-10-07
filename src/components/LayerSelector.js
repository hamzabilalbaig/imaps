import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Paper,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import {
  Check as CheckIcon,
  ChevronLeft,
  ChevronRight,
  Layers as LayersIcon
} from "@mui/icons-material";
import { useMapLayers } from "../hooks/useMapLayers";
import { saveMapState } from "../utils/mapStateUtils";
import { debounce } from "../utils/debounce";

/**
 * Component for quick layer selection on the map - now shows as buttons in bottom center
 */
function LayerSelector({ position = "bottom-center", showInPublic = true, isAdmin = false, isRightSidebarVisible = false }) {
  const { layers, activeLayer, setActiveLayer } = useMapLayers();
  const [isChangingLayer, setIsChangingLayer] = useState(false);
  const debouncedLayerChangeRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);



  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isBottomCenter = position === 'bottom-center';
  const isMenuOpen = Boolean(menuAnchorEl);

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

  const mobileBottomOffset = useMemo(
    () => `calc(16px + env(safe-area-inset-bottom, 0px))`,
    []
  );

  const containerPositionStyles = useMemo(() => {
    const desktopBottom = 16;
    switch (position) {
      case "top-right":
        return {
          top: { xs: 8, md: 16 },
          right: { xs: 8, md: 16 },
          transform: 'none'
        };
      case "top-left":
        return {
          top: { xs: 8, md: 16 },
          left: { xs: 8, md: 16 },
          transform: 'none'
        };
      case "bottom-right":
        return {
          bottom: isMobile ? mobileBottomOffset : desktopBottom,
          right: { xs: 16, md: 16 },
          transform: 'none'
        };
      case "bottom-left":
        return {
          bottom: isMobile ? mobileBottomOffset : desktopBottom,
          left: { xs: 16, md: 16 },
          transform: 'none'
        };
      case "bottom-center":
      default:
        return isMobile
          ? {
              bottom: mobileBottomOffset,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100vw - 120px)'
            }
          : {
              bottom: desktopBottom,
              left: '50%',
              transform: 'translateX(-50%)'
            };
    }
  }, [isMobile, mobileBottomOffset, position]);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const updateScrollState = () => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < maxScrollLeft - 8);
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [layers, isMobile]);

  const handleArrowScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction * (isMobile ? 140 : 220);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
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

  const handleMobileLayerSelect = (layerId) => {
    handleLayerChange(layerId);
    handleMenuClose();
  };

  if (!showInPublic && !isAdmin) {
    return null;
  }

  if (isMobile) {
    const sidebarOffset = isRightSidebarVisible ? 362 : 10;

    return (
      <>
        <Box
          sx={{
            position: 'absolute',
            bottom: `calc(180px + env(safe-area-inset-bottom, 0px))`,
            right: sidebarOffset,
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          <IconButton
            onClick={handleMenuOpen}
            size="medium"
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.common.black, 0.2),
              boxShadow: `0 6px 18px ${alpha(theme.palette.common.black, 0.2)}`,
              color: 'text.primary',
              transition: 'transform 120ms ease, background-color 120ms ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                transform: 'translateY(-2px)'
              }
            }}
            aria-label="Select map layer"
          >
            <LayersIcon fontSize="small" />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          PaperProps={{
            sx: {
              mb: 1,
              px: 0.5,
              borderRadius: 2,
              minWidth: 200
            }
          }}
          keepMounted
        >
          {layers.map((layer) => {
            const isActive = activeLayer === layer.id || layer.isActive;
            return (
              <MenuItem
                key={layer.id}
                onClick={() => handleMobileLayerSelect(layer.id)}
                selected={isActive}
                dense
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckIcon
                    fontSize="small"
                    sx={{ opacity: isActive ? 1 : 0, transition: 'opacity 150ms ease' }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={layer.name}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500
                  }}
                />
              </MenuItem>
            );
          })}
        </Menu>
      </>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        ...containerPositionStyles,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pointerEvents: 'auto'
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          width: isBottomCenter ? { xs: '100%', md: 'auto' } : 'auto',
          maxWidth: isBottomCenter ? { xs: '100%', md: 520 } : 520
        }}
      >
        <Box sx={{ position: 'relative', width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'hidden',
              px: { xs: 0.5, md: 0 },
              py: { xs: 0.5, md: 0 },
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none'
            }}
            ref={scrollContainerRef}
          >
          <ButtonGroup 
            variant="contained" 
            size={isMobile ? "small" : "medium"}
            sx={{
              flexWrap: 'nowrap',
              '& .MuiButton-root': {
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.82rem' },
                px: { xs: 2, md: 2.5 },
                py: { xs: 1, md: 1.2 },
                minWidth: { xs: 72, md: 84 },
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
            {layers.map((layer) => {
              const isActive = activeLayer === layer.id || layer.isActive;
              return (
                <Button
                  key={layer.id}
                  onClick={() => handleLayerChange(layer.id)}
                  className={isActive ? 'active' : ''}
                  disabled={isChangingLayer}
                  startIcon={isActive ? <CheckIcon sx={{ fontSize: '1rem' }} /> : null}
                >
                  {layer.name}
                </Button>
              );
            })}
          </ButtonGroup>
        </Box>

          {isBottomCenter && canScrollLeft && (
            <IconButton
              size="small"
              onClick={() => handleArrowScroll(-1)}
              sx={{
                position: 'absolute',
                left: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: 2,
                '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 0.95) }
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          )}

          {isBottomCenter && canScrollRight && (
            <IconButton
              size="small"
              onClick={() => handleArrowScroll(1)}
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: 2,
                '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 0.95) }
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default LayerSelector;
