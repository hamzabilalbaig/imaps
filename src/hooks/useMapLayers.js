import { useState, useEffect } from "react";

const LAYERS_STORAGE_KEY = "map-layers";
const LAYERS_VERSION_KEY = "map-layers-version";
const CURRENT_VERSION = "2.0"; // Updated version to force reset

// Default built-in layers
const DEFAULT_LAYERS = [
  {
    id: "base",
    name: "Base Map (No Labels)",
    type: "builtin",
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isActive: true,
    isDefault: true,
    maxZoom: 19,
  },
  {
    id: "osm",
    name: "OpenStreetMap (No Labels)",
    type: "builtin",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isActive: false,
    isDefault: false,
    maxZoom: 19,
  },
  {
    id: "satellite",
    name: "Satellite View",
    type: "builtin",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UER, and the GIS User Community',
    isActive: false,
    isDefault: false,
    maxZoom: 18,
  },
  {
    id: "topo",
    name: "Topographic (No Labels)",
    type: "builtin",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isActive: false,
    isDefault: false,
    maxZoom: 19,
  },
  {
    id: "dark",
    name: "Dark Theme (No Labels)",
    type: "builtin",
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isActive: false,
    isDefault: false,
    maxZoom: 19,
  }
];

/**
 * Custom hook for managing map layers with localStorage persistence
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

  const addLayer = (layerData) => {
    const newLayer = {
      id: `custom_${Date.now()}`,
      name: layerData.name,
      type: "custom",
      url: layerData.url,
      attribution: layerData.attribution || "",
      isActive: false,
      isDefault: false,
      maxZoom: layerData.maxZoom || 18,
      createdAt: new Date().toISOString(),
    };

    setLayers(prev => [...prev, newLayer]);
    return newLayer;
  };

  const updateLayer = (layerId, updates) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, ...updates, updatedAt: new Date().toISOString() }
          : layer
      )
    );
  };

  const removeLayer = (layerId) => {
    setLayers(prev => {
      const filtered = prev.filter(layer => layer.id !== layerId);
      
      // If we removed the active layer, activate the first remaining layer
      const hasActive = filtered.some(layer => layer.isActive);
      if (!hasActive && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      
      return filtered;
    });
  };

  const setActiveLayer = (layerId) => {
    setLayers(prev =>
      prev.map(layer => ({
        ...layer,
        isActive: layer.id === layerId
      }))
    );
    window.location.reload(); // Force reload to apply new active layer
  };

  const resetToDefaults = () => {
    setLayers(DEFAULT_LAYERS);
  };

  const getActiveLayer = () => {
    return layers.find(layer => layer.isActive) || layers[0];
  };

  const getBuiltinLayers = () => {
    return layers.filter(layer => layer.type === "builtin");
  };

  const getCustomLayers = () => {
    return layers.filter(layer => layer.type === "custom");
  };

  return {
    layers,
    activeLayer: getActiveLayer(),
    builtinLayers: getBuiltinLayers(),
    customLayers: getCustomLayers(),
    addLayer,
    updateLayer,
    removeLayer,
    setActiveLayer,
    resetToDefaults,
  };
}
