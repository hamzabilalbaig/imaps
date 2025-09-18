import { useState, useEffect } from "react";
import { getAllMapLayers } from "../api/functions/apiFunctions";

const LAYERS_STORAGE_KEY = "map-layers";
const ACTIVE_LAYER_KEY = "active-layer-id";
const LAYERS_VERSION_KEY = "map-layers-version";
const CURRENT_VERSION = "4.0"; // Updated version for database layers

// Fallback local layers using images from public/maps (in case API fails)
const FALLBACK_LAYERS = [
  {
    id: "atlas",
    name: "Atlas",
    type: "local",
    imageUrl: `/maps/atlas.png?v=${Date.now()}`,
    backgroundColor: '#e8f4f8',
    isActive: true,
    isDefault: true,
  },
  {
    id: "road",
    name: "Road",
    type: "local", 
    imageUrl: `/maps/road.png?v=${Date.now()}`,
    backgroundColor: '#f5f5f5',
    isActive: false,
    isDefault: true,
  },
  {
    id: "satellite",
    name: "Satellite",
    type: "local",
    imageUrl: `/maps/satallite.png?v=${Date.now()}`,
    backgroundColor: '#2c3e50',
    isActive: false,
    isDefault: true,
  },
  {
    id: "uv",
    name: "UV",
    type: "local",
    imageUrl: `/maps/UV.png?v=${Date.now()}`,
    backgroundColor: '#8e44ad',
    isActive: false,
    isDefault: true,
  }
];

/**
 * Custom hook for managing map layers from database with localStorage persistence for active layer
 */
export function useMapLayers() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load layers from database
  useEffect(() => {
    const loadLayers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check version and reset if outdated
        const savedVersion = localStorage.getItem(LAYERS_VERSION_KEY);
        if (savedVersion !== CURRENT_VERSION) {
          localStorage.removeItem(LAYERS_STORAGE_KEY);
          localStorage.removeItem(ACTIVE_LAYER_KEY);
          localStorage.setItem(LAYERS_VERSION_KEY, CURRENT_VERSION);
        }

        // Try to get layers from database
        const dbLayers = await getAllMapLayers();
        
        if (dbLayers && dbLayers.length > 0) {
          // Convert database layers to the expected format
          const formattedLayers = dbLayers.map(layer => ({
            id: layer.id.toString(),
            name: layer.name,
            type: "database",
            imageUrl: layer.image_url,
            description: layer.description,
            backgroundColor: layer.background_color || '#f0f0f0',
            isActive: false,
            isDefault: false,
            created_at: layer.created_at
          }));

          // Get saved active layer ID
          const savedActiveLayerId = localStorage.getItem(ACTIVE_LAYER_KEY);
          let hasActiveLayer = false;

          // Set active layer
          const layersWithActive = formattedLayers.map(layer => {
            if (savedActiveLayerId && layer.id === savedActiveLayerId) {
              hasActiveLayer = true;
              return { ...layer, isActive: true };
            }
            return layer;
          });

          // If no saved active layer or saved layer not found, make first layer active
          if (!hasActiveLayer && layersWithActive.length > 0) {
            layersWithActive[0].isActive = true;
            localStorage.setItem(ACTIVE_LAYER_KEY, layersWithActive[0].id);
          }

          setLayers(layersWithActive);
        } else {
          // Fallback to local layers if no database layers
          console.log('No database layers found, using fallback layers');
          setLayers(FALLBACK_LAYERS);
        }
      } catch (error) {
        console.error("Error loading layers from database:", error);
        setError(error);
        // Fallback to local layers on error
        setLayers(FALLBACK_LAYERS);
      } finally {
        setLoading(false);
      }
    };

    loadLayers();
  }, []);

  const setActiveLayer = (layerId) => {
    setLayers(prev =>
      prev.map(layer => ({
        ...layer,
        isActive: layer.id === layerId
      }))
    );
    
    // Save active layer to localStorage
    localStorage.setItem(ACTIVE_LAYER_KEY, layerId);
    // Broadcast the change so other hook instances (in other components) can sync
    try {
      if (typeof window !== 'undefined' && window?.CustomEvent) {
        window.dispatchEvent(new CustomEvent('mapLayerChanged', { detail: { layerId } }));
      }
    } catch (err) {
      // ignore
    }
  };

  // Listen for global layer change events so multiple components using this hook
  // stay in sync (avoids requiring a full page reload when one component updates)
  useEffect(() => {
    const handler = (e) => {
      const incomingId = e?.detail?.layerId || localStorage.getItem(ACTIVE_LAYER_KEY);
      if (!incomingId) return;
      setLayers(prev => prev.map(layer => ({ ...layer, isActive: layer.id === incomingId })));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mapLayerChanged', handler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mapLayerChanged', handler);
      }
    };
  }, []);

  const resetToDefaults = () => {
    setLayers(FALLBACK_LAYERS);
    localStorage.removeItem(ACTIVE_LAYER_KEY);
  };

  const getActiveLayer = () => {
    return layers.find(layer => layer.isActive) || layers[0];
  };

  const getBuiltinLayers = () => {
    return layers.filter(layer => layer.type === "local");
  };

  const getCustomLayers = () => {
    return layers.filter(layer => layer.type === "database");
  };

  const refreshLayers = async () => {
    try {
      setLoading(true);
      const dbLayers = await getAllMapLayers();
      
      if (dbLayers && dbLayers.length > 0) {
        const formattedLayers = dbLayers.map(layer => ({
          id: layer.id.toString(),
          name: layer.name,
          type: "database",
          imageUrl: layer.image_url,
          description: layer.description,
          isActive: false,
          isDefault: false,
          created_at: layer.created_at
        }));

        // Preserve active layer
        const activeLayerId = getActiveLayer()?.id;
        const layersWithActive = formattedLayers.map(layer => ({
          ...layer,
          isActive: layer.id === activeLayerId
        }));

        // If active layer was removed, make first layer active
        if (!layersWithActive.some(layer => layer.isActive) && layersWithActive.length > 0) {
          layersWithActive[0].isActive = true;
          localStorage.setItem(ACTIVE_LAYER_KEY, layersWithActive[0].id);
        }

        setLayers(layersWithActive);
      }
    } catch (error) {
      console.error("Error refreshing layers:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    layers,
    activeLayer: getActiveLayer(),
    builtinLayers: getBuiltinLayers(),
    customLayers: getCustomLayers(),
    setActiveLayer,
    resetToDefaults,
    refreshLayers,
    loading,
    error
  };
}