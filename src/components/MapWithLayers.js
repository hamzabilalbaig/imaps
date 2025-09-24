import React, { useEffect, useRef, useState } from "react";
import { MapContainer, ImageOverlay, useMap, ZoomControl } from "react-leaflet";
import { Box, Typography, Alert } from "@mui/material";
import { useMapLayers } from "../hooks/useMapLayers";
import LayerSelector from "./LayerSelector";
import L from "leaflet";
import { restoreMapState } from "../utils/mapStateUtils";
import { FaPen } from "react-icons/fa";
import { debounce } from "../utils/debounce";


function DynamicImageOverlay({ imageUrl, bounds: initialBounds }) {
  const map = useMap();
  const overlayRef = useRef(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [dynamicBounds, setDynamicBounds] = useState(initialBounds);
  const imageLoadingRef = useRef(false);
  const currentImageUrlRef = useRef(imageUrl);

  
  useEffect(() => {
    window.leafletMap = map;
    
    
    map.on('directMarkerClick', function(e) {
      console.log('Direct marker click event received:', e);
      
      
      const latLng = e.latlng;
      let clickedMarker = null;
      let minDistance = Infinity;
      
      
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
      
      
      if (clickedMarker && minDistance < 100) {
        console.log('Found marker within 100m, opening popup:', clickedMarker);
        clickedMarker.openPopup();
      } else {
        console.log('No marker found near coordinates');
      }
    });
  }, [map]);

  useEffect(() => {
    if (!imageUrl) {
      // Clean up if no imageUrl provided
      if (overlayRef.current) {
        if (map.hasLayer(overlayRef.current)) {
          map.removeLayer(overlayRef.current);
        }
        overlayRef.current = null;
      }
      return;
    }

    // Always remove ALL existing overlays first to prevent overlapping
    map.eachLayer((layer) => {
      if (layer instanceof L.ImageOverlay) {
        map.removeLayer(layer);
      }
    });
    
    // Reset our overlay reference
    overlayRef.current = null;

    // Prevent multiple simultaneous image loads for the same URL
    if (imageLoadingRef.current && currentImageUrlRef.current === imageUrl) {
      return;
    }

    currentImageUrlRef.current = imageUrl;
    imageLoadingRef.current = true;
    setIsImageLoading(true);
    
    const img = new Image();
    img.onload = () => {
      try {
        // Check if this is still the current image request
        if (currentImageUrlRef.current !== imageUrl) {
          imageLoadingRef.current = false;
          return;
        }

        // Calculate dynamic bounds based on image aspect ratio
        const imageWidth = img.width;
        const imageHeight = img.height;
        const aspectRatio = imageWidth / imageHeight;
        
        // Keep the center point the same
        const center = [
          (initialBounds[0][0] + initialBounds[1][0]) / 2,
          (initialBounds[0][1] + initialBounds[1][1]) / 2
        ];
        
        // Calculate height of the initial bounds
        const latSpan = Math.abs(initialBounds[1][0] - initialBounds[0][0]);
        const lngSpan = Math.abs(initialBounds[1][1] - initialBounds[0][1]);
        
        // Adjust bounds to match the image aspect ratio
        const newLatSpan = aspectRatio > 1 ? lngSpan / aspectRatio : latSpan;
        const newLngSpan = aspectRatio > 1 ? lngSpan : latSpan * aspectRatio;
        
        // Create new bounds with the same center but adjusted dimensions
        const newBounds = [
          [center[0] - newLatSpan/2, center[1] - newLngSpan/2],
          [center[0] + newLatSpan/2, center[1] + newLngSpan/2]
        ];
        
        setDynamicBounds(newBounds);
        
        const imageUrlWithCache = imageUrl.includes('?') 
          ? `${imageUrl}&t=${Date.now()}` 
          : `${imageUrl}?t=${Date.now()}`;
        
        overlayRef.current = L.imageOverlay(imageUrlWithCache, newBounds, {
          opacity: 1,
          interactive: false,
          crossOrigin: true
        });

        overlayRef.current.addTo(map);
        
        // Single map refresh after successful overlay addition
        requestAnimationFrame(() => {
          try {
            if (map && map._container && map._loaded) {
              map.invalidateSize({ animate: false });
            }
          } catch (err) {
            console.log("Map refresh after image load error:", err);
          }
        });

        setIsImageLoading(false);
        imageLoadingRef.current = false;
      } catch (err) {
        console.log("Image overlay creation error:", err);
        setIsImageLoading(false);
        imageLoadingRef.current = false;
      }
    };
    
    img.onerror = () => {
      console.log("Failed to load image:", imageUrl);
      setIsImageLoading(false);
      imageLoadingRef.current = false;
    };
    
    
    img.src = imageUrl;

    
    return () => {
      if (overlayRef.current) {
        if (map.hasLayer(overlayRef.current)) {
          map.removeLayer(overlayRef.current);
        }
        overlayRef.current = null;
      }
      setIsImageLoading(false);
    };
  }, [imageUrl, initialBounds, map]);

  return null;
}
  
function MapStateRestorer({ imageBounds }) {
  const map = useMap();
  const restoredRef = useRef(false);
  
  useEffect(() => {
    if (restoredRef.current) return; 
    
    
    const timeoutId = setTimeout(() => {
      try {
        
        if (map && map._container && map._loaded) {
          const restored = restoreMapState(map);
          restoredRef.current = true;
          
          
          if (!restored) {
            
            
            
            
            
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


function MapRefresher({ layerId }) {
  const map = useMap();
  const refreshTimeoutRef = useRef(null);

  // Create debounced refresh function
  const debouncedRefresh = useRef(
    debounce((currentCenter, currentZoom) => {
      try {
        if (map && map._container && map._loaded) {
          map.invalidateSize({ animate: false });
          
          if (currentCenter && currentZoom !== undefined) {
            map.setView(currentCenter, currentZoom, { animate: false });
          }
        }
      } catch (err) {
        console.log("Map refresh error:", err);
      }
    }, 200) // 200ms debounce
  ).current;

  useEffect(() => {
    // Clear any existing refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    let currentCenter, currentZoom;
    
    try {
      if (map && map._loaded) {
        currentCenter = map.getCenter();
        currentZoom = map.getZoom();
      }
    } catch (err) {
      console.log("Could not get map state:", err);
    }

    // Use debounced refresh instead of immediate timeout
    debouncedRefresh(currentCenter, currentZoom);
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [layerId, map, debouncedRefresh]);

  return null;
}


function MapBackgroundUpdater({ activeLayer }) {
  const map = useMap();
  const lastBackgroundRef = useRef(null);

  // Create debounced background update function
  const debouncedBackgroundUpdate = useRef(
    debounce((backgroundColor) => {
      try {
        if (!map || !map._container) return;
        
        const mapContainer = map._container;
        if (mapContainer) {
          mapContainer.style.backgroundColor = backgroundColor;
        }
        
        const mapPane = map.getPane('mapPane');
        if (mapPane) {
          mapPane.style.backgroundColor = backgroundColor;
        }
        
        const tilesPane = map.getPane('tilePane');
        if (tilesPane) {
          tilesPane.style.backgroundColor = backgroundColor;
        }
        
        // Single refresh after background update
        if (map && map._loaded) {
          map.invalidateSize({ animate: false });
        }
      } catch (err) {
        console.log("Map background update error:", err);
      }
    }, 150) // 150ms debounce
  ).current;

  useEffect(() => {
    if (!activeLayer) return;

    const backgroundColor = activeLayer.backgroundColor || activeLayer.background_color || '#f0f0f0';
    
    // Skip if same background color
    if (lastBackgroundRef.current === backgroundColor) {
      return;
    }

    lastBackgroundRef.current = backgroundColor;
    debouncedBackgroundUpdate(backgroundColor);
  }, [activeLayer, debouncedBackgroundUpdate]);

  return null;
}

function MapWithLayers({ 
  children, 
  center, 
  zoom, 
  className = "w-full h-full !border-[0px]",
  showLayerSelector = true,
  layerSelectorPosition = "bottom-center",
  isAdmin = false,
  streetsVisible = true,
  isRightSidebarVisible,
  onAddPOI, // Add POI handler prop
  imageBounds = [  // Add this prop with default value
    [24.75, 67.0], 
    [25.05, 67.3]  
  ]
}) {
  const { activeLayer } = useMapLayers();
  const mapRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  
  useEffect(() => {
    
    const updateZoomControlPosition = () => {
      try {
        const mapContainer = mapRef.current?._container;
        if (!mapContainer) return;
        
        const zoomControl = mapContainer.querySelector('.leaflet-control-zoom');
        
        if (zoomControl) {
          if (isRightSidebarVisible) {
            zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
            console.log('Added zoom control class for right sidebar'); 
          } else {
            zoomControl.classList.remove("zoomControlsAfterRightSidebarOpen");
            console.log('Removed zoom control class for right sidebar'); 
          }
        } else {
          console.log('Zoom control not found'); 
        }
      } catch (err) {
        console.log("Zoom control update error:", err);
      }
    };

    
    if (isMounted) {
      updateZoomControlPosition();
    }

    
    if (isRightSidebarVisible !== undefined) {
      updateZoomControlPosition();
    }

    
    const timeouts = [100, 300, 600, 900].map(delay => 
      setTimeout(updateZoomControlPosition, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isRightSidebarVisible, isMounted]);
  
  
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

    
    initializeZoomControlPosition();
    
    
    const timeoutId = setTimeout(initializeZoomControlPosition, 200);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, isRightSidebarVisible]);
  
  useEffect(() => {
    
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      setIsMounted(false);
    };
  }, []);
  
  React.useEffect(() => {
    try {
      const mapInstance = mapRef.current || window.leafletMap;
      if (!mapInstance) return;
      if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && zoom !== undefined) {
        if (mapInstance && mapInstance._loaded) {
          mapInstance.setView(center, zoom, { animate: false });
          
          initialCenterRef.current = center;
          initialZoomRef.current = zoom;
        }
      }
    } catch (err) {
      
    }
  }, [center, zoom]);

  if (!isMounted) {
    return null; 
  }


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
        crs={L.CRS.Simple} 
        minZoom={10.4}
        maxZoom={15}
        
        style={{ 
          background: activeLayer?.backgroundColor || activeLayer?.background_color || '#f0f0f0',
          transition: 'background-color 0.3s ease'
        }}
        
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        whenCreated={(mapInstance) => {
          try {
            
            mapRef.current = mapInstance;
            
            
            window.leafletMap = mapInstance;
            
            
            if (isRightSidebarVisible) {
              const zoomControl = mapInstance._container?.querySelector('.leaflet-control-zoom');
              if (zoomControl) {
                zoomControl.classList.add("zoomControlsAfterRightSidebarOpen");
                console.log('Applied zoom control positioning on map creation');
              }
            }
            
            
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
        
        <ZoomControl position="bottomright"  />
        <DynamicImageOverlay 
          key={`${activeLayer.id}-${activeLayer.imageUrl}`}
          imageUrl={activeLayer.imageUrl} 
          bounds={imageBounds} 
        />
        
        <MapRefresher layerId={activeLayer.id} />
        <MapBackgroundUpdater activeLayer={activeLayer} />
        <MapStateRestorer imageBounds={imageBounds} />
        
        {children}
      </MapContainer>

      {/* Pencil Icon Above Zoom Controls - Only show for non-admin users */}
      {!isAdmin && onAddPOI && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 140, // Position above zoom controls
            right: isRightSidebarVisible ? 362 : 10, // Sync with zoom control position
            zIndex: 1000,
            width: 30,
            height: 30,
            backgroundColor: 'white',
            borderRadius: 1,
            boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
            border: '2px solid rgba(0,0,0,0.2)',
            
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            
            transition: 'right 300ms ease, background-color 200ms ease, transform 150ms ease', // Smooth transition like sidebar
            '&:hover': {
              backgroundColor: '#f4f4f4',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          }}
          onClick={onAddPOI}
          title="Add POI"
        >
          <FaPen size={18} color="#666" />
        </Box>
      )}

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