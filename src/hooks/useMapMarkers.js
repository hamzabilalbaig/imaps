import { useState } from "react";
import { createMarker } from "../utils/mapUtils";

/**
 * Custom hook for managing map markers
 */
export function useMapMarkers() {
  const [markers, setMarkers] = useState([]);
  const [clickedCoords, setClickedCoords] = useState(null);

  const addMarker = (latlng) => {
    const newMarker = createMarker(latlng);
    setMarkers((prev) => [...prev, newMarker]);
    setClickedCoords(newMarker.coords);
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
    removeMarker,
    clearAllMarkers,
  };
}
