import { useState, useEffect } from "react";
import { createMarker } from "../utils/mapUtils";
import { useAuth } from "../contexts/AuthContext";
import { localDB } from "../utils/localStorage";

/**
 * Custom hook for managing map markers with localStorage persistence and auth integration
 */
export function useMapMarkers() {
  const { user, canCreatePOI, getRemainingPOIs, canAddPOItoCategory } = useAuth();
  
  // Initialize state with data from localStorage
  const [markers, setMarkers] = useState([]);
  const [clickedCoords, setClickedCoords] = useState(null);

  // Load markers when user changes or component mounts
  useEffect(() => {
    if (user) {
      const userMarkers = localDB.getUserPOIs();
      setMarkers(userMarkers);
    } else {
      setMarkers([]);
    }
  }, [user]);

  const addMarker = (latlng, poiData) => {
    if (!user) return { success: false, error: 'You must be logged in to create POIs' };
    
    const userMarkers = markers.filter(m => m.userId === user.id);
    
    // Check total POI limit
    if (!canCreatePOI(userMarkers.length)) {
      return { 
        success: false, 
        error: `You have reached your POI limit. Upgrade your plan to create more POIs.`,
        currentCount: userMarkers.length,
        remaining: getRemainingPOIs(userMarkers.length)
      };
    }

    // Check per-category limit if a category is selected
    if (poiData.categoryId) {
      const poisInCategory = localDB.getPOICountInCategory(poiData.categoryId);
      if (!canAddPOItoCategory(poiData.categoryId, poisInCategory)) {
        return {
          success: false,
          error: `You have reached the POI limit for this category. Upgrade your plan or choose a different category.`,
          categoryLimit: true
        };
      }
    }

    const markerData = createMarker(latlng, poiData);
    const result = localDB.addPOI(markerData);
    
    if (result.success) {
      // Reload markers from localStorage
      const updatedMarkers = localDB.getUserPOIs();
      setMarkers(updatedMarkers);
      setClickedCoords(result.poi.coords);
      return { success: true, marker: result.poi };
    }
    
    return result;
  };

  const updateMarker = (markerId, updatedData) => {
    const result = localDB.updatePOI(markerId, updatedData);
    if (result.success) {
      // Reload markers from localStorage
      const updatedMarkers = localDB.getUserPOIs();
      setMarkers(updatedMarkers);
    }
    return result;
  };

  const removeMarker = (markerId) => {
    const result = localDB.deletePOI(markerId);
    if (result.success) {
      // Reload markers from localStorage
      const updatedMarkers = localDB.getUserPOIs();
      setMarkers(updatedMarkers);
    }
    return result;
  };

  const clearAllMarkers = () => {
    // For admin, this would need special handling
    // For now, just clear the current view
    setMarkers([]);
    setClickedCoords(null);
  };

  const getUserMarkerCount = () => {
    if (!user) return 0;
    return markers.filter(m => m.userId === user.id).length;
  };

  return {
    markers, // Return user-specific markers
    clickedCoords,
    addMarker,
    updateMarker,
    removeMarker,
    clearAllMarkers,
    getUserMarkerCount,
    canCreateMore: user ? canCreatePOI(getUserMarkerCount()) : false,
    remainingPOIs: user ? getRemainingPOIs(getUserMarkerCount()) : 0,
    // Add a reactive user marker count that updates with markers state
    // userMarkerCount: user ? markers.filter(m => m.userId === user.id).length : 0,
    userMarkerCount: JSON.parse(localStorage.getItem('imaps_current_user'))?.pois?.length || 0,
    // Add all markers for admin view
    allMarkers: markers,
  };
}