import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Box, Typography, Alert } from "@mui/material";
import { useMapLayers } from "../hooks/useMapLayers";
import LayerSelector from "./LayerSelector";

/**
 * Map component with dynamic layer support
 */
function MapWithLayers({ 
  children, 
  center, 
  zoom, 
  className = "w-full h-full",
  showLayerSelector = true,
  layerSelectorPosition = "top-right",
  isAdmin = false 
}) {
  const { activeLayer } = useMapLayers();

  if (!activeLayer) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'grey.100'
        }}
      >
        <Alert severity="warning" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No map layer available
          </Typography>
          <Typography variant="body2">
            Please configure map layers in admin panel
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className={className}
        key={activeLayer.id} // Force re-render when layer changes
      >
        <TileLayer
          url={activeLayer.url}
          attribution={activeLayer.attribution}
          maxZoom={activeLayer.maxZoom}
        />
        
        {children}
      </MapContainer>

      {showLayerSelector && (
        <LayerSelector 
          position={layerSelectorPosition}
          showInPublic={true}
          isAdmin={isAdmin}
        />
      )}
    </Box>
  );
}

export default MapWithLayers;
