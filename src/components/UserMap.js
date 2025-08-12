import React, { useState, useEffect } from "react";
import {
  Snackbar
} from "@mui/material";
import InteractiveMapLayout from "./InteractiveMapLayout";
import useUserStore from "../stores/user";
import usePOIsStore from "../stores/pois";
import useSubCategoriesStore from "../stores/subCategories";

/**
 * User Map component with full editing capabilities for authenticated users
 */
function UserMap() {
  // Use new POI stores
  const { pois, createPOI, updatePOI, deletePOI, initializePOIs } = usePOIsStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  const { id, name, email, role, initializeUser, isUserAdmin } = useUserStore();

  useEffect(() => {
    initializeUser();
    initializePOIs();
    initializeSubCategories();
  }, []); // Only run once on mount

  const user = { id, name, email, role };
  const isAdmin = isUserAdmin();

  // Filter POIs for current user (admins see all, users see their own + approved)
  const userPOIs = isAdmin ? 
    pois : 
    pois.filter(poi => poi.user_id === id || poi.is_approved === true);

  // Calculate POI limits for regular users
  const userOwnedPOIs = pois.filter(poi => poi.user_id === id);
  const userMarkerCount = userOwnedPOIs.length;
  const MAX_USER_POIS = 10; // Adjust as needed
  const canCreateMore = isAdmin || userMarkerCount < MAX_USER_POIS;
  const remainingPOIs = isAdmin ? Infinity : Math.max(0, MAX_USER_POIS - userMarkerCount);

  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const handleMapClick = (latlng) => {
    if (canCreateMore) {
      setPendingLocation(latlng);
      setEditingPOI(null);
      setShowForm(true);
      setIsSuggestMode(false);
    } else {
      setSnackbar({
        open: true,
        message: 'You have reached your POI limit. Upgrade your plan to add more locations.',
        severity: 'warning'
      });
    }
  };

  const handleSuggestLocation = () => {
    setIsSuggestMode(!isSuggestMode);
  };

  const handleAddNote = () => {
    setIsNoteMode(!isNoteMode);
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi);
    setPendingLocation(null);
    setShowForm(true);
  };

  const handleSavePOI = async (formData) => {
    try {
      if (editingPOI) {
        const result = await updatePOI(editingPOI.id, formData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'POI updated successfully!',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: result.error || 'Failed to update POI',
            severity: 'error'
          });
        }
      } else if (pendingLocation) {
        const poiData = {
          ...formData,
          coords: [pendingLocation.lat, pendingLocation.lng],
          user_id: id
        };
        const result = await createPOI(poiData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'POI created successfully!',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: result.error || 'Failed to create POI',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while saving the POI',
        severity: 'error'
      });
    }
    handleCancelForm();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleRemovePOI = async (poiId) => {
    if (window.confirm("Are you sure you want to delete this POI?")) {
      try {
        const result = await deletePOI(poiId);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'POI removed successfully!',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: result.error || 'Failed to delete POI',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'An error occurred while deleting the POI',
          severity: 'error'
        });
      }
    }
  };

  const handleMarkerClick = (marker) => {
    // Users can click markers to edit them
    handleEditPOI(marker);
  };

  return (
    <>
      <InteractiveMapLayout
        pois={userPOIs}
        subCategories={subCategories}
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
        userMarkerCount={userMarkerCount}
        maxMarkers={MAX_USER_POIS}
        canCreateMore={canCreateMore}
        onSuggestLocation={handleSuggestLocation}
        isSuggestMode={isSuggestMode}
        onAddNote={handleAddNote}
        isNoteMode={isNoteMode}
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

export default UserMap;
