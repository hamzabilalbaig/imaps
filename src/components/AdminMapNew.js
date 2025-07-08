import React, { useState } from "react";
import {
  Snackbar
} from "@mui/material";
import InteractiveMapLayout from "./InteractiveMapLayout";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { useAuth } from "../contexts/AuthContext";

/**
 * Admin Map component with full editing capabilities
 */
function AdminMap() {
  const { allMarkers: markers, addMarker, updateMarker, removeMarker, clearAllMarkers } = useMapMarkers();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);

  const handleMapClick = (latlng) => {
    setPendingLocation(latlng);
    setEditingPOI(null);
    setShowForm(true);
    setIsSuggestMode(false); // Exit suggest mode after clicking
  };

  const handleSuggestLocation = () => {
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
    if (window.confirm("Are you sure you want to delete this POI?")) {
      removeMarker(poiId);
      setSnackbar({
        open: true,
        message: 'POI removed successfully!',
        severity: 'success'
      });
    }
  };

  const handleMarkerClick = (marker) => {
    // Admin can click markers to edit them directly
    handleEditPOI(marker);
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
        isAdmin={true}
        userMarkerCount={markers.length}
        maxMarkers={Infinity}
        canCreateMore={true}
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

export default AdminMap;
