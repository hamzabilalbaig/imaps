import React, { useState } from "react";
import { 
  Snackbar
} from "@mui/material";
import InteractiveMapLayout from "./InteractiveMapLayout";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { useAuth } from "../contexts/AuthContext";

/**
 * Public Map component - now allows users to create POIs within their plan limits
 */
function PublicMap() {
  const { 
    markers, 
    addMarker, 
    updateMarker, 
    removeMarker, 
    getUserMarkerCount,
    canCreateMore,
    remainingPOIs
  } = useMapMarkers();
  const { user, isAdmin } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);

  const handleMapClick = (latlng) => {
    // Only allow map clicks when in suggest mode
    if (!isSuggestMode) {
      return;
    }
    
    if (!canCreateMore) {
      setSnackbar({
        open: true,
        message: `You've reached your POI limit (${getUserMarkerCount()}). Upgrade your plan to create more.`,
        severity: 'warning'
      });
      setIsSuggestMode(false); // Exit suggest mode
      return;
    }
    
    setPendingLocation(latlng);
    setEditingPOI(null);
    setShowForm(true);
    setIsSuggestMode(false); // Exit suggest mode after clicking
  };

  const handleSuggestLocation = () => {
    if (!canCreateMore) {
      setSnackbar({
        open: true,
        message: `You've reached your POI limit (${getUserMarkerCount()}). Upgrade your plan to create more.`,
        severity: 'warning'
      });
      return;
    }
    setIsSuggestMode(!isSuggestMode);
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi);
    setPendingLocation(null);
    setShowForm(true);
  };

  const handleSavePOI = (formData) => {
    if (editingPOI) {
      updateMarker(editingPOI.id, formData);
      setSnackbar({
        open: true,
        message: 'POI updated successfully!',
        severity: 'success'
      });
    } else if (pendingLocation) {
      const result = addMarker(pendingLocation, formData);
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'POI created successfully!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error,
          severity: 'error'
        });
      }
    }
    handleCancelForm();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleRemovePOI = (poiId) => {
    removeMarker(poiId);
    setSnackbar({
      open: true,
      message: 'POI removed successfully!',
      severity: 'success'
    });
  };

  const handleMarkerClick = (marker) => {
    // You can implement zoom to marker or show details here
    console.log('Marker clicked:', marker);
  };

  return (
    <>
      <InteractiveMapLayout
        markers={markers}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        onMarkerEdit={handleEditPOI}
        onMarkerRemove={handleRemovePOI}
        showForm={showForm}
        editingPOI={editingPOI}
        pendingLocation={pendingLocation}
        onSavePOI={handleSavePOI}
        onCancelForm={handleCancelForm}
        user={user}
        isAdmin={isAdmin}
        userMarkerCount={getUserMarkerCount()}
        maxMarkers={user?.plan === 'free' ? 5 : user?.plan === 'pro' ? 50 : Infinity}
        canCreateMore={canCreateMore}
        onSuggestLocation={handleSuggestLocation}
        isSuggestMode={isSuggestMode}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
}

export default PublicMap;
