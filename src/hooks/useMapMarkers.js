import { useState, useEffect } from "react";
import { createMarker } from "../utils/mapUtils";
import { useAuth } from "../contexts/AuthContext";

const STORAGE_KEY = "map-markers";

// Default POIs for initial demonstration
const DEFAULT_POIS = [
  
];

/**
 * Custom hook for managing map markers with localStorage persistence and auth integration
 */
export function useMapMarkers() {
  const { user, canCreatePOI, getRemainingPOIs } = useAuth();
  
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

  // Filter markers based on user permissions
  const filteredMarkers = user ? markers.filter(marker => {
    // Admins can see all markers
    if (user.role === 'admin') return true;
    // Regular users can only see their own markers or public ones
    return !marker.userId || marker.userId === user.id;
  }) : [];

  // Save markers to localStorage whenever markers change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
    } catch (error) {
      console.error("Error saving markers to localStorage:", error);
    }
  }, [markers]);

  const addMarker = (latlng, poiData) => {
    if (!user) return { success: false, error: 'You must be logged in to create POIs' };
    
    const userMarkers = markers.filter(m => m.userId === user.id);
    if (!canCreatePOI(userMarkers.length)) {
      return { 
        success: false, 
        error: `You have reached your POI limit. Upgrade your plan to create more POIs.`,
        currentCount: userMarkers.length,
        remaining: getRemainingPOIs(userMarkers.length)
      };
    }

    const newMarker = createMarker(latlng, { 
      ...poiData, 
      userId: user.id,
      userName: user.name,
      userEmail: user.email
    });
    setMarkers((prev) => [...prev, newMarker]);
    setClickedCoords(newMarker.coords);
    return { success: true, marker: newMarker };
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

  const getUserMarkerCount = () => {
    if (!user) return 0;
    return markers.filter(m => m.userId === user.id).length;
  };

  return {
    markers: filteredMarkers, // Return filtered markers based on user permissions
    allMarkers: markers, // Admin might need access to all markers
    clickedCoords,
    addMarker,
    updateMarker,
    removeMarker,
    clearAllMarkers,
    getUserMarkerCount,
    canCreateMore: user ? canCreatePOI(getUserMarkerCount()) : false,
    remainingPOIs: user ? getRemainingPOIs(getUserMarkerCount()) : 0,
  };
}