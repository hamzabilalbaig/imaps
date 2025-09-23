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
  const [isImageLoading, setIsImageLoading] = useState(false);

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
    if (!imageUrl) return;
    
    setIsImageLoading(true);
    
    // Remove existing overlay if it exists
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }

    // Preload the image to ensure it's ready before adding to map
    const img = new Image();
    img.onload = () => {
      try {
        // Create new overlay with the current image
        const imageUrlWithCache = imageUrl.includes('?') 
          ? `${imageUrl}&t=${Date.now()}` 
          : `${imageUrl}?t=${Date.now()}`;
        
        overlayRef.current = L.imageOverlay(imageUrlWithCache, bounds, {
          opacity: 1,
          interactive: false,
          crossOrigin: true
        });

        // Add the new overlay to the map
        overlayRef.current.addTo(map);
        
        setIsImageLoading(false);

        // Force map refresh after image is loaded and added
        if (map && map._container && map._loaded) {
          // Use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            try {
              map.invalidateSize({ animate: false });
              
              // Additional refresh after a short delay
              setTimeout(() => {
                if (map && map._loaded) {
                  map.invalidateSize({ animate: false });
                }
              }, 50);
            } catch (err) {
              console.log("Map refresh after image load error:", err);
            }
          });
        }
      } catch (err) {
        console.log("Image overlay creation error:", err);
        setIsImageLoading(false);
      }
    };
    
    img.onerror = () => {
      console.log("Failed to load image:", imageUrl);
      setIsImageLoading(false);
    };
    
    // Start loading the image
    img.src = imageUrl;

    // Cleanup function
    return () => {
      if (overlayRef.current && map.hasLayer(overlayRef.current)) {
        map.removeLayer(overlayRef.current);
      }
      setIsImageLoading(false);
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
 * Component to update map background color when layer changes
 */
function MapBackgroundUpdater({ activeLayer }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map._container || !activeLayer) return;

    try {
      const backgroundColor = activeLayer.backgroundColor || activeLayer.background_color || '#f0f0f0';
      
      // Update the main map container's background color
      const mapContainer = map._container;
      if (mapContainer) {
        mapContainer.style.backgroundColor = backgroundColor;
      }
      
      // Also update any inner containers that might need the background
      const mapPane = map.getPane('mapPane');
      if (mapPane) {
        mapPane.style.backgroundColor = backgroundColor;
      }
      
      // Update tiles pane if it exists
      const tilesPane = map.getPane('tilePane');
      if (tilesPane) {
        tilesPane.style.backgroundColor = backgroundColor;
      }
      
      // Force immediate redraw
      setTimeout(() => {
        try {
          if (map && map._loaded) {
            map.invalidateSize({ animate: false });
          }
        } catch (err) {
          console.log("Background update redraw error:", err);
        }
      }, 10);
      
    } catch (err) {
      console.log("Map background update error:", err);
    }
  }, [map, activeLayer]);

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
  // Keep initial center/zoom stable to avoid resetting view on re-renders
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  
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
            console.log('Added zoom control class for right sidebar'); // Debug log
          } else {
            zoomControl.classList.remove("zoomControlsAfterRightSidebarOpen");
            console.log('Removed zoom control class for right sidebar'); // Debug log
          }
        } else {
          console.log('Zoom control not found'); // Debug log
        }
      } catch (err) {
        console.log("Zoom control update error:", err);
      }
    };

    // Update immediately if component is mounted
    if (isMounted) {
      updateZoomControlPosition();
    }

    // Also update immediately when sidebar visibility changes
    if (isRightSidebarVisible !== undefined) {
      updateZoomControlPosition();
    }

    // Also try with delays to ensure the control is rendered
    const timeouts = [100, 300, 600, 900].map(delay => 
      setTimeout(updateZoomControlPosition, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isRightSidebarVisible, isMounted]);
  
  // Separate effect to handle initial positioning when component mounts
  useEffect(() => {
    if (!isMounted) return;
    
    const initializeZoomControlPosition = () => {
      try {
        const mapContainer = mapRef.current?._container;
        if (!mapContainer) return;
        
        const zoomControl = mapContainer.querySelector('.leaflet-control-zoom');
        
        if (zoomControl) {
          if (isRightSidebarVisible) {
            zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
            console.log('Initialized zoom control with sidebar positioning');
          } else {
            zoomControl.classList.remove("zoomControlsAfterRightSidebarOpen");
            console.log('Initialized zoom control without sidebar positioning');
          }
        }
      } catch (err) {
        console.log("Zoom control initialization error:", err);
      }
    };

    // Initialize immediately
    initializeZoomControlPosition();
    
    // Also try after a short delay
    const timeoutId = setTimeout(initializeZoomControlPosition, 200);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, isRightSidebarVisible]);
  
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
  // If parent changes the center/zoom (for example focusing a POI), update the map view
  React.useEffect(() => {
    try {
      const mapInstance = mapRef.current || window.leafletMap;
      if (!mapInstance) return;
      if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && zoom !== undefined) {
        if (mapInstance && mapInstance._loaded) {
          mapInstance.setView(center, zoom, { animate: false });
          // update refs to keep them in sync
          initialCenterRef.current = center;
          initialZoomRef.current = zoom;
        }
      }
    } catch (err) {
      // noop
    }
  }, [center, zoom]);

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
      overflow: 'hidden',
    }}>
      <MapContainer
        ref={mapRef}
        center={initialCenterRef.current}
        zoom={initialZoomRef.current}
        className={className}
        crs={L.CRS.Simple} // Use simple CRS for local images
        minZoom={10.4}
        maxZoom={15}
        // maxBounds={imageBounds}
        style={{ 
          background: activeLayer?.backgroundColor || activeLayer?.background_color || '#f0f0f0',
          transition: 'background-color 0.3s ease'
        }}
        // maxBoundsViscosity={1.0}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        whenCreated={(mapInstance) => {
          try {
            // Store map instance for manual control
            mapRef.current = mapInstance;
            
            // Set the global map instance as a fallback
            window.leafletMap = mapInstance;
            
            // Apply zoom control styling immediately if sidebar is visible
            if (isRightSidebarVisible) {
              const zoomControl = mapInstance._container?.querySelector('.leaflet-control-zoom');
              if (zoomControl) {
                zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
                console.log('Applied zoom control positioning on map creation');
              }
            }
            
            // Safely refresh map after it's fully loaded
            setTimeout(() => {
              if (mapInstance && mapInstance._container && mapInstance._loaded) {
                mapInstance.invalidateSize({ animate: false });
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
        <MapBackgroundUpdater activeLayer={activeLayer} />
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