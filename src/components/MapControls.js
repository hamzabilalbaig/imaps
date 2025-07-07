import React from "react";

/**
 * Control panel for map actions
 * @param {Array} markers - Array of current markers
 * @param {Function} onClearAll - Callback to clear all markers
 */
function MapControls({ markers, onClearAll }) {
  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total markers: <span className="font-medium">{markers.length}</span>
        </div>
        <button
          onClick={onClearAll}
          disabled={markers.length === 0}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            markers.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600 transition-colors"
          }`}
        >
          Clear All Markers
        </button>
      </div>
    </div>
  );
}

export default MapControls;
