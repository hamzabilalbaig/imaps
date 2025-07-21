import React, { useEffect, useRef } from "react";
import { MapContainer, ImageOverlay, useMap } from "react-leaflet";
import { Box, Typography, Alert } from "@mui/material";
import { useMapLayers } from "../hooks/useMapLayers";
import LayerSelector from "./LayerSelector";
import L from "leaflet";

/**
 * Component to handle dynamic image overlay updates
 */
function DynamicImageOverlay({ imageUrl, bounds }) {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    // Remove existing overlay if it exists
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Create new overlay with the current image
    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 1,
      interactive: false,
      crossOrigin: true
    });

    // Add the new overlay to the map
    overlayRef.current.addTo(map);

    // Force map to refresh
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds);
    }, 100);

    // Cleanup function
    return () => {
      if (overlayRef.current && map.hasLayer(overlayRef.current)) {
        map.removeLayer(overlayRef.current);
      }
    };
  }, [imageUrl, bounds, map]);

  return null;
}

/**
 * Component to force map refresh when layer changes
 */
function MapRefresher({ layerId }) {
  const map = useMap();

  useEffect(() => {
    // Multiple methods to force refresh
    const refreshMap = () => {
      // Method 1: Invalidate size
      map.invalidateSize(true);
      
      // Method 2: Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Method 3: Force redraw
      map._onResize();
      
      // Method 4: Pan slightly and back
      const center = map.getCenter();
      const tempCenter = L.latLng(center.lat + 0.0001, center.lng + 0.0001);
      map.panTo(tempCenter, { animate: false });
      setTimeout(() => {
        map.panTo(center, { animate: false });
      }, 50);
    };

    // Delay to ensure DOM is ready
    setTimeout(refreshMap, 100);
    setTimeout(refreshMap, 300);
    setTimeout(refreshMap, 500);

  }, [layerId, map]);

  return null;
}

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
  const mapRef = useRef(null);

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
        ref={mapRef}
        center={center}
        zoom={zoom}
        className={className}
        key={`map-${activeLayer.id}-${Date.now()}`} // Force complete re-render
        crs={L.CRS.Simple} // Use simple CRS for local images
        minZoom={10}
        maxZoom={15}
        zoomControl={true}
        attributionControl={false}
        whenCreated={(mapInstance) => {
          // Store map instance for manual control
          mapRef.current = mapInstance;
          
          // Force initial refresh
          setTimeout(() => {
            mapInstance.invalidateSize(true);
            mapInstance.fitBounds(imageBounds);
          }, 100);
        }}
      >
        <DynamicImageOverlay 
          imageUrl={activeLayer.imageUrl} 
          bounds={imageBounds} 
        />
        
        <MapRefresher layerId={activeLayer.id} />
        
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