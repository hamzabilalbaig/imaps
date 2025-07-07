import React from "react";
import { Box, Alert, AlertTitle, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import MapMarker from "./MapMarker";
import MapWithLayers from "./MapWithLayers";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { MAP_CONFIG } from "../utils/mapUtils";

/**
 * Public Map component - read-only view for visitors
 */
function PublicMap() {
  const { markers } = useMapMarkers();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Alert 
        severity="info" 
        icon={<VisibilityIcon />}
        sx={{ 
          m: { xs: 1, md: 2 }, 
          mb: { xs: 0.5, md: 1 }
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
          Public View
        </AlertTitle>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          Explore the map and view points of interest. ({markers.length} markers)
        </Typography>
      </Alert>

      <Box sx={{ 
        flex: 1, 
        position: 'relative', 
        mx: { xs: 1, md: 2 }, 
        mb: { xs: 1, md: 2 }
      }}>
        <MapWithLayers
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          showLayerSelector={true}
          layerSelectorPosition="top-right"
          isAdmin={false}
        >
          {/* No MapClickHandler - users can't add markers */}
          
          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              marker={marker}
              onRemove={null} // No remove functionality in public view
              onEdit={null} // No edit functionality in public view
              isAdmin={false}
            />
          ))}
        </MapWithLayers>
      </Box>
    </Box>
  );
}

export default PublicMap;
