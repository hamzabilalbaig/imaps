import React, { useState } from "react";
import {
  Box,
  Paper,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Layers as LayersIcon
} from "@mui/icons-material";
import { useMapLayers } from "../hooks/useMapLayers";

/**
 * Component for quick layer selection on the map
 */
function LayerSelector({ position = "top-right", showInPublic = true, isAdmin = false }) {
  const { layers, activeLayer, setActiveLayer } = useMapLayers();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!showInPublic && !isAdmin) {
    return null;
  }

  const positionClasses = {
    "top-right": { top: { xs: 8, md: 16 }, right: { xs: 8, md: 16 } },
    "top-left": { top: { xs: 8, md: 16 }, left: { xs: 8, md: 16 } },
    "bottom-right": { bottom: { xs: 8, md: 16 }, right: { xs: 8, md: 16 } },
    "bottom-left": { bottom: { xs: 8, md: 16 }, left: { xs: 8, md: 16 } },
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
    handleClose();
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positionClasses[position],
        zIndex: 1000,
        minWidth: { xs: 140, md: 200 }
      }}
    >
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Button
          onClick={handleClick}
          fullWidth
          sx={{
            p: { xs: 1.5, md: 2 },
            justifyContent: 'space-between',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'grey.50'
            }
          }}
          endIcon={<ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
          startIcon={!isMobile ? <LayersIcon /> : null}
        >
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              {activeLayer?.name || "No Layer"}
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary">
                Map Layer
              </Typography>
            )}
          </Box>
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              minWidth: { xs: 140, md: 200 },
              maxHeight: 300
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {layers.map((layer) => (
            <MenuItem
              key={layer.id}
              onClick={() => handleLayerChange(layer.id)}
              selected={layer.isActive}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                  color: 'primary.700',
                  '&:hover': {
                    backgroundColor: 'primary.100'
                  }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {layer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {layer.type === "custom" ? "Custom" : "Built-in"}
                  </Typography>
                </Box>
                {layer.isActive && (
                  <CheckIcon sx={{ width: 16, height: 16 }} />
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </Box>
  );
}

export default LayerSelector;
