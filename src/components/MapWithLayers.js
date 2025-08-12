import React, { useEffect, useRef, useState } from "react";
import { MapContainer, ImageOverlay, useMap, ZoomControl } from "react-leaflet";
import { Box, Typography, Alert } from "@mui/material";
import { useMapLayers } from "../hooks/useMapLayers";
import LayerSelector from "./LayerSelector";
import L from "leaflet";
import { restoreMapState } from "../utils/mapStateUtils";

/**
 * Component to handle dynamic image overlay updates
 */
function DynamicImageOverlay({ imageUrl, bounds }) {
  const map = useMap();
  const overlayRef = useRef(null);

  // Store the map instance globally for access by other components
  useEffect(() => {
    window.leafletMap = map;
  }, [map]);

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

    // Force map to refresh without changing view
    setTimeout(() => {
      map.invalidateSize();
      // Note: Removed fitBounds call to prevent resetting the view
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
 * Component to restore map state from localStorage
 */
function MapStateRestorer() {
  const map = useMap();
  const restoredRef = useRef(false);
  
  useEffect(() => {
    if (restoredRef.current) return; // Only restore once
    
    // Try to restore map state after a short delay
    setTimeout(() => {
      const restored = restoreMapState(map);
      restoredRef.current = true;
      
      // Only fit bounds if state wasn't restored
      if (!restored) {
        // Default behavior for initial load
        const imageBounds = [
          [24.8, 67.0], // Southwest corner
          [25.0, 67.3]  // Northeast corner
        ];
        map.fitBounds(imageBounds);
      }
    }, 100);
  }, [map]);
  
  return null;
}

/**
 * Component to force map refresh when layer changes
 */
function MapRefresher({ layerId }) {
  const map = useMap();

  useEffect(() => {
    // Store current view state
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Simple refresh that preserves view state
    const refreshMap = () => {
      // Method 1: Invalidate size
      map.invalidateSize(true);
      
      // Restore view state
      setTimeout(() => {
        map.setView(currentCenter, currentZoom, { animate: false });
      }, 50);
    };

    // Single refresh with small delay
    setTimeout(refreshMap, 100);

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
  streetsVisible = true,
  isRightSidebarVisible
}) {
  const { activeLayer } = useMapLayers();
  const mapRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Function to update zoom control position
    const updateZoomControlPosition = () => {
      const mapContainer = mapRef.current?._container;
      if (!mapContainer) return;
      
      const zoomControl = mapContainer.querySelector('.leaflet-control-zoom');
      
      if (zoomControl) {
        if (isRightSidebarVisible) {
          zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
          console.log('Added zoom control class'); // Debug log
        } else {
          zoomControl.classList.remove("zoomControlsAfterRightSidebarOpen");
          console.log('Removed zoom control class'); // Debug log
        }
      } else {
        console.log('Zoom control not found'); // Debug log
      }
    };

    // Try multiple times with increasing delays to ensure the control is rendered
    const timeouts = [100, 300, 500, 1000].map(delay => 
      setTimeout(updateZoomControlPosition, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isRightSidebarVisible, isMounted]);
  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => setIsMounted(false);
  }, []);
  if (!isMounted) {
    return null; // Prevent rendering during initial mount
  }
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
  


  return isMounted && (
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
        key={`map-${activeLayer.id}`} // Only re-render when layer changes
        crs={L.CRS.Simple} // Use simple CRS for local images
        minZoom={10}
        maxZoom={15}
        zoomControl={false}
        attributionControl={false}
        whenCreated={(mapInstance) => {
          // Store map instance for manual control
          mapRef.current = mapInstance;
          
          // Set the global map instance as a fallback
          // (DynamicImageOverlay will set it again when it renders)
          window.leafletMap = mapInstance;
          
          // No need to force fitBounds on initial load - MapStateRestorer will handle this
          setTimeout(() => {
            mapInstance.invalidateSize(true);
            
            // Apply zoom control styling if sidebar is visible
            if (isRightSidebarVisible) {
              const zoomControl = mapInstance._container?.querySelector('.leaflet-control-zoom');
              if (zoomControl) {
                zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
              }
            }
          }, 200);
        }}
      >
        <ZoomControl position="bottomright" />
        <DynamicImageOverlay 
          imageUrl={activeLayer.imageUrl} 
          bounds={imageBounds} 
        />
        
        <MapRefresher layerId={activeLayer.id} />
        <MapStateRestorer />
        
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