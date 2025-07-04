import React from "react";
import { Marker, Popup } from "react-leaflet";

/**
 * Individual marker component with popup
 * @param {Object} marker - Marker data object
 * @param {Function} onRemove - Callback function to remove the marker
 */
function MapMarker({ marker, onRemove }) {
  return (
    <Marker key={marker.id} position={marker.position}>
      <Popup>
        <div className="text-center">
          <p className="font-medium mb-2">Marker Location</p>
          <p className="text-sm text-gray-600 mb-3">{marker.coords}</p>
          <button
            onClick={() => onRemove(marker.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Remove Marker
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
