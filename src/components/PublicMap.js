import React from "react";
import MapMarker from "./MapMarker";
import MapWithLayers from "./MapWithLayers";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { MAP_CONFIG } from "../utils/mapUtils";

/**
 * Public Map component - read-only view for visitors
 */
function PublicMap() {
  const { markers } = useMapMarkers();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <strong>Public View:</strong> Explore the map and view points of interest. ({markers.length} markers)
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
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
      </div>
    </div>
  );
}

export default PublicMap;
