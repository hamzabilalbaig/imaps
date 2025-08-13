import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  Snackbar
} from "@mui/material";
import InteractiveMapLayout from "./InteractiveMapLayout";
import useUserStore from "../stores/user";
import usePOIsStore from "../stores/pois";
import useSubCategoriesStore from "../stores/subCategories";

/**
 * Public Map component - read-only view for unauthenticated users showing admin content
 */
function PublicMap() {
  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  // Use new POI stores
  const { pois, initializePOIs } = usePOIsStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  const { id, initializeUser, isAuthenticated, isUserAdmin } = useUserStore();

  useEffect(() => {
    initializeUser();
    initializePOIs();
    initializeSubCategories();
  }, []); // Only run once on mount

  // Filter only approved POIs for public view
  const approvedPOIs = pois.filter(poi => poi.is_approved === true);

  // Debug logging
  useEffect(() => {
    console.log('PublicMap - Total POIs:', pois.length);
    console.log('PublicMap - Approved POIs:', approvedPOIs.length);
    if (pois.length > 0) {
      console.log('PublicMap - Sample POI:', pois[0]);
      console.log('PublicMap - POI approval statuses:', pois.map(p => ({id: p.id, name: p.name, is_approved: p.is_approved, type: typeof p.is_approved})));
    }
    console.log('PublicMap - SubCategories:', subCategories.length);
  }, [pois, approvedPOIs, subCategories]);

  // If user is authenticated, redirect them to their dashboard
  if (isAuthenticated()) {
    return <Navigate to="/map" replace />;
  }

  const handleMapClick = (latlng) => {
    // Disable map clicks for creating POIs in public view
    setSnackbar({
      open: true,
      message: 'This map is view-only. Interaction is limited to exploring existing content.',
      severity: 'info'
    });
  };

  const handleSuggestLocation = () => {
    setSnackbar({
      open: true,
      message: 'This map is view-only. Suggesting locations is not allowed.',
      severity: 'info'
    });
  };

  const handleAddNote = () => {
    setSnackbar({
      open: true,
      message: 'This map is view-only. Adding notes is not allowed.',
      severity: 'info'
    });
  };

  const handleEditPOI = () => {
    setSnackbar({
      open: true,
      message: 'This map is view-only. Editing POIs is not allowed.',
      severity: 'info'
    });
  };

  const handleSavePOI = () => {
    setSnackbar({
      open: true,
      message: 'This map is view-only. Saving POIs is not allowed.',
      severity: 'info'
    });
  };

  const handleRemovePOI = () => {
    setSnackbar({
      open: true,
      message: 'This map is view-only. Removing POIs is not allowed.',
      severity: 'info'
    });
  };

  const handleMarkerClick = (marker) => {
    // You can implement zoom to marker or show details here
    console.log('Marker clicked:', marker);
  };

  return (
    <>
      <InteractiveMapLayout
        pois={approvedPOIs}
        subCategories={subCategories}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        onMarkerEdit={handleEditPOI}
        onMarkerRemove={handleRemovePOI}
        showForm={showForm}
        editingPOI={editingPOI}
        pendingLocation={pendingLocation}
        onSavePOI={handleSavePOI}
        onCancelForm={() => setShowForm(false)}
        user={null}
        isAdmin={false}
        readOnly={true}
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

export default PublicMap;
