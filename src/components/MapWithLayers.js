import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
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
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center text-gray-500">
          <p>No map layer available</p>
          <p className="text-sm">Please configure map layers in admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
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
    </div>
  );
}

export default MapWithLayers;
