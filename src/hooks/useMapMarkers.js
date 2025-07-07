import { useState, useEffect } from "react";
import { createMarker } from "../utils/mapUtils";

const STORAGE_KEY = "map-markers";

// Default POIs for initial demonstration
const DEFAULT_POIS = [
  {
    id: 1,
    position: [24.917037, 67.131161],
    coords: "24.917037, 67.131161",
    title: "Karachi Port",
    description: "Major seaport of Pakistan located in Karachi, Sindh",
    category: "Transportation",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    position: [24.860735, 67.001151],
    coords: "24.860735, 67.001151",
    title: "Clifton Beach",
    description: "Popular beach destination in Karachi with restaurants and activities",
    category: "Tourist Attraction",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    position: [24.865048, 67.075453],
    coords: "24.865048, 67.075453",
    title: "Dolmen Mall",
    description: "Large shopping mall with restaurants, shops and entertainment",
    category: "Shopping",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  }
];

/**
 * Custom hook for managing map markers with localStorage persistence
 */
export function useMapMarkers() {
  // Initialize state with data from localStorage or default POIs
  const [markers, setMarkers] = useState(() => {
    try {
      const savedMarkers = localStorage.getItem(STORAGE_KEY);
      if (savedMarkers) {
        const parsed = JSON.parse(savedMarkers);
        return parsed.length > 0 ? parsed : DEFAULT_POIS;
      }
      return DEFAULT_POIS;
    } catch (error) {
      console.error("Error loading markers from localStorage:", error);
      return DEFAULT_POIS;
    }
  });
  const [clickedCoords, setClickedCoords] = useState(null);

  // Save markers to localStorage whenever markers change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
    } catch (error) {
      console.error("Error saving markers to localStorage:", error);
    }
  }, [markers]);

  const addMarker = (latlng, poiData) => {
    const newMarker = createMarker(latlng, poiData);
    setMarkers((prev) => [...prev, newMarker]);
    setClickedCoords(newMarker.coords);
  };

  const updateMarker = (markerId, updatedData) => {
    setMarkers((prev) => 
      prev.map((marker) => 
        marker.id === markerId 
          ? { ...marker, ...updatedData, updatedAt: new Date().toISOString() }
          : marker
      )
    );
  };

  const removeMarker = (markerId) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== markerId));
  };

  const clearAllMarkers = () => {
    setMarkers([]);
    setClickedCoords(null);
  };

  return {
    markers,
    clickedCoords,
    addMarker,
    updateMarker,
    removeMarker,
    clearAllMarkers,
  };
}
