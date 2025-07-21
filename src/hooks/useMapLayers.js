import { useState, useEffect } from "react";

const LAYERS_STORAGE_KEY = "map-layers";
const LAYERS_VERSION_KEY = "map-layers-version";
const CURRENT_VERSION = "3.0"; // Updated version for local maps

// Custom local layers using images from public/maps
const DEFAULT_LAYERS = [
  {
    id: "atlas",
    name: "Atlas",
    type: "local",
    imageUrl: `/maps/atlas.png?v=${Date.now()}`,
    isActive: true,
    isDefault: true,
  },
  {
    id: "road",
    name: "Road",
    type: "local", 
    imageUrl: `/maps/road.png?v=${Date.now()}`,
    isActive: false,
    isDefault: true,
  },
  {
    id: "satellite",
    name: "Satellite",
    type: "local",
    imageUrl: `/maps/satallite.png?v=${Date.now()}`,
    isActive: false,
    isDefault: true,
  },
  {
    id: "uv",
    name: "UV",
    type: "local",
    imageUrl: `/maps/UV.png?v=${Date.now()}`,
    isActive: false,
    isDefault: true,
  }
];

/**
 * Custom hook for managing local map layers with localStorage persistence
 */
export function useMapLayers() {
  const [layers, setLayers] = useState(() => {
    try {
      // Check version and reset if outdated
      const savedVersion = localStorage.getItem(LAYERS_VERSION_KEY);
      if (savedVersion !== CURRENT_VERSION) {
        localStorage.removeItem(LAYERS_STORAGE_KEY);
        localStorage.setItem(LAYERS_VERSION_KEY, CURRENT_VERSION);
        return DEFAULT_LAYERS;
      }

      const savedLayers = localStorage.getItem(LAYERS_STORAGE_KEY);
      if (savedLayers) {
        const parsed = JSON.parse(savedLayers);
        // Ensure at least one layer is active
        const hasActive = parsed.some(layer => layer.isActive);
        if (!hasActive && parsed.length > 0) {
          parsed[0].isActive = true;
        }
        return parsed;
      }
      return DEFAULT_LAYERS;
    } catch (error) {
      console.error("Error loading layers from localStorage:", error);
      return DEFAULT_LAYERS;
    }
  });

  // Save layers to localStorage whenever layers change
  useEffect(() => {
    try {
      localStorage.setItem(LAYERS_STORAGE_KEY, JSON.stringify(layers));
    } catch (error) {
      console.error("Error saving layers to localStorage:", error);
    }
  }, [layers]);

  const setActiveLayer = (layerId) => {
    setLayers(prev =>
      prev.map(layer => ({
        ...layer,
        isActive: layer.id === layerId
      }))
    );
  };

  const resetToDefaults = () => {
    setLayers(DEFAULT_LAYERS);
  };

  const getActiveLayer = () => {
    return layers.find(layer => layer.isActive) || layers[0];
  };

  const getBuiltinLayers = () => {
    return layers.filter(layer => layer.type === "local");
  };

  const getCustomLayers = () => {
    return []; // No custom layers for local maps
  };

  return {
    layers,
    activeLayer: getActiveLayer(),
    builtinLayers: getBuiltinLayers(),
    customLayers: getCustomLayers(),
    setActiveLayer,
    resetToDefaults,
  };
}