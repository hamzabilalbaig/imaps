import React from "react";

/**
 * Control panel for map actions
 * @param {Array} markers - Array of current markers
 * @param {Function} onClearAll - Callback to clear all markers
 */
function MapControls({ markers, onClearAll }) {
  return (
    <div className="">
      <button
        onClick={onClearAll}
        disabled={markers.length === 0}
        className=""
      >
        Clear All ({markers.length})
      </button>
    </div>
  );
}

export default MapControls;
