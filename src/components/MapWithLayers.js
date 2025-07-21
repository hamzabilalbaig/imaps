import React from "react";
import { MapContainer, ImageOverlay } from "react-leaflet";
import { Box, Typography, Alert } from "@mui/material";
import { useMapLayers } from "../hooks/useMapLayers";
import LayerSelector from "./LayerSelector";
import L from "leaflet";

/**
 * Map component with local image layers
 */
function MapWithLayers({ 
  children, 
  center, 
  zoom, 
  className = "w-full h-full",
  showLayerSelector = true,
  layerSelectorPosition = "bottom-center",
  isAdmin = false,
  streetsVisible = true
}) {
  const { activeLayer } = useMapLayers();

  // Define bounds for the image overlay (adjust these coordinates as needed)
  const imageBounds = [
    [24.8, 67.0], // Southwest corner
    [25.0, 67.3]  // Northeast corner
  ];

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
            Please select a map layer
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      overflow: 'hidden'
    }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className={className}
        key={activeLayer.id}
        crs={L.CRS.Simple} // Use simple CRS for local images
        minZoom={10}
        maxZoom={15}
        zoomControl={true}
        attributionControl={false}
      >
        <ImageOverlay
          url={activeLayer.imageUrl}
          bounds={imageBounds}
          opacity={1}
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