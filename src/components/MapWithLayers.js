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
    
    // Add an event listener to handle direct marker clicking
    map.on('directMarkerClick', function(e) {
      console.log('Direct marker click event received:', e);
      
      // Find the marker at the given coordinates
      const latLng = e.latlng;
      let clickedMarker = null;
      let minDistance = Infinity;
      
      // Search through all markers on the map
      map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
          const markerLatLng = layer.getLatLng();
          const distance = markerLatLng.distanceTo(latLng);
          
          if (distance < minDistance) {
            minDistance = distance;
            clickedMarker = layer;
          }
        }
      });
      
      // If a marker is found within 100 meters, open its popup
      if (clickedMarker && minDistance < 100) {
        console.log('Found marker within 100m, opening popup:', clickedMarker);
        clickedMarker.openPopup();
      } else {
        console.log('No marker found near coordinates');
      }
    });
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
      try {
        // Check if map is still valid
        if (map && map._container && map._loaded) {
          map.invalidateSize({ animate: false });
        }
      } catch (err) {
        console.log("Map refresh error:", err);
      }
    }, 300);

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
    const timeoutId = setTimeout(() => {
      try {
        // Check if map is still valid
        if (map && map._container && map._loaded) {
          const restored = restoreMapState(map);
          restoredRef.current = true;
          
          // Only fit bounds if state wasn't restored
          if (!restored) {
            // Default behavior for initial load
            const imageBounds = [
              [24.8, 67.0], // Southwest corner
              [25.0, 67.3]  // Northeast corner
            ];
            if (map._loaded) {
              map.fitBounds(imageBounds, { animate: false });
            }
          }
        }
      } catch (err) {
        console.log("Map state restoration error:", err);
      }
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [map]);
  
  return null;
}

/**
 * Component to force map refresh when layer changes
 */
function MapRefresher({ layerId }) {
  const map = useMap();

  useEffect(() => {
    // Store current view state if possible
    let currentCenter, currentZoom;
    
    try {
      if (map && map._loaded) {
        currentCenter = map.getCenter();
        currentZoom = map.getZoom();
      }
    } catch (err) {
      console.log("Could not get map state:", err);
    }

    // Simple refresh that preserves view state
    const refreshMap = () => {
      try {
        // Check if map is still valid
        if (map && map._container && map._loaded) {
          // Method 1: Invalidate size
          map.invalidateSize({ animate: false });
          
          // Restore view state if available
          if (currentCenter && currentZoom !== undefined) {
            setTimeout(() => {
              if (map && map._loaded) {
                map.setView(currentCenter, currentZoom, { animate: false });
              }
            }, 100);
          }
        }
      } catch (err) {
        console.log("Map refresh error:", err);
      }
    };

    // Single refresh with small delay
    const timeoutId = setTimeout(refreshMap, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
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
  className = "w-full h-full !border-[0px]",
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
      try {
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
      } catch (err) {
        console.log("Zoom control update error:", err);
      }
    };

    // Try multiple times with increasing delays to ensure the control is rendered
    const timeouts = [300, 600, 900, 1200].map(delay => 
      setTimeout(updateZoomControlPosition, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isRightSidebarVisible, isMounted]);
  useEffect(() => {
    // Allow time for DOM to be fully ready before marking component as mounted
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      setIsMounted(false);
    };
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
  
  // This ensures the map is only rendered when mounted and layer is available
  if (!isMounted) {
    return null;
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
        key={`map-${activeLayer.id}`} // Only re-render when layer changes
        crs={L.CRS.Simple} // Use simple CRS for local images
        minZoom={12}
        maxZoom={15}
        zoomControl={false}
        attributionControl={false}
        whenCreated={(mapInstance) => {
          try {
            // Store map instance for manual control
            mapRef.current = mapInstance;
            
            // Set the global map instance as a fallback
            window.leafletMap = mapInstance;
            
            // Safely refresh map after it's fully loaded
            setTimeout(() => {
              if (mapInstance && mapInstance._container && mapInstance._loaded) {
                mapInstance.invalidateSize({ animate: false });
                
                // Apply zoom control styling if sidebar is visible
                if (isRightSidebarVisible) {
                  const zoomControl = mapInstance._container?.querySelector('.leaflet-control-zoom');
                  if (zoomControl) {
                    zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
                  }
                }
              }
            }, 300);
          } catch (err) {
            console.log("Map creation error:", err);
          }
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