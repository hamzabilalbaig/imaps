import React, { useState } from "react";
import { useMapLayers } from "../hooks/useMapLayers";

/**
 * Component for quick layer selection on the map
 */
function LayerSelector({ position = "top-right", showInPublic = true, isAdmin = false }) {
  const { layers, activeLayer, setActiveLayer } = useMapLayers();
  const [isOpen, setIsOpen] = useState(false);

  if (!showInPublic && !isAdmin) {
    return null;
  }

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
    setIsOpen(false);
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-[1000]`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        {/* Current Layer Display */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">
              {activeLayer?.name || "No Layer"}
            </div>
            <div className="text-xs text-gray-500">Map Layer</div>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Layer Options */}
        {isOpen && (
          <div className="border-t border-gray-200">
            <div className="max-h-64 overflow-y-auto">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => handleLayerChange(layer.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                    layer.isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{layer.name}</div>
                    <div className="text-xs opacity-75">
                      {layer.type === "custom" ? "Custom" : "Built-in"}
                    </div>
                  </div>
                  {layer.isActive && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LayerSelector;
