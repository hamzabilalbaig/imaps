import { useState, useEffect } from "react";

const LAYERS_STORAGE_KEY = "map-layers";

// Default built-in layers
const DEFAULT_LAYERS = [
  {
    id: "osm",
    name: "OpenStreetMap",
    type: "builtin",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    isActive: true,
    isDefault: true,
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
    name: "Topographic",
    type: "builtin",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    isActive: false,
    isDefault: false,
    maxZoom: 17,
  },
  {
    id: "dark",
    name: "Dark Theme",
    type: "builtin",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
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
