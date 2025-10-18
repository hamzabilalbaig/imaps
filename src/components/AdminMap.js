import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Box,
  Fab,
  Tooltip
} from "@mui/material";
import {
  Dashboard as DashboardIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import InteractiveMapLayout from "./InteractiveMapLayout";
import useUserStore from "../stores/user";
import usePOIsStore from "../stores/pois";
import useSubCategoriesStore from "../stores/subCategories";
import { useAlerts } from "../hooks/useAlerts";

const normalizeCoords = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  const toNumber = (candidate) => {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate.trim());
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  const buildPair = (maybePair) => {
    if (!Array.isArray(maybePair) || maybePair.length < 2) {
      return null;
    }

    const first = toNumber(maybePair[0]);
    const second = toNumber(maybePair[1]);

    if (first === null || second === null) {
      return null;
    }

    return [first, second];
  };

  if (Array.isArray(value)) {
    return buildPair(value);
  }

  if (typeof value === 'string') {
    const matches = value.match(/-?\d+(?:\.\d+)?/g);
    if (matches && matches.length >= 2) {
      return buildPair(matches.slice(0, 2));
    }
    return null;
  }

  if (value && typeof value === 'object') {
    const { lat, lng, latitude, longitude } = value;
    if (lat != null && lng != null) {
      return buildPair([lat, lng]);
    }
    if (latitude != null && longitude != null) {
      return buildPair([latitude, longitude]);
    }
  }

  return null;
};

/**
 * Admin Map component with full editing capabilities
 * This is the map view accessible from the admin dashboard
 */
function AdminMap() {
  const navigate = useNavigate();
  const { confirm } = useAlerts();
  
  // Use new POI stores
  const { pois, createPOI, updatePOI, deletePOI, initializePOIs } = usePOIsStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  const { id, name, email, role, initializeUser, isUserAdmin } = useUserStore();

  useEffect(() => {
    const initializeData = async () => {
      await initializeUser();
      
      // Redirect if not admin
      if (!isUserAdmin()) {
        navigate('/map');
        return;
      }
      
      await initializePOIs();
      await initializeSubCategories();
    };

    initializeData();
  }, []);

  const user = { id, name, email, role };
  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const handleMapClick = (latlng) => {
    setPendingLocation(latlng);
    setEditingPOI(null);
    setShowForm(true);
    setIsSuggestMode(false); // Exit suggest mode after clicking
  };

  const handleSuggestLocation = () => {
    setIsSuggestMode(!isSuggestMode);
  };

  const handleAddNote = () => {
    // Toggle note mode for admin
    setIsNoteMode((prev) => !prev);
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi);
    setPendingLocation(null);
    setShowForm(true);
  };

  const handleSavePOI = async (formData) => {
    try {
      if (editingPOI) {
        const existingCoords = normalizeCoords(formData.coords)
          || normalizeCoords(editingPOI?.position)
          || normalizeCoords(editingPOI?.coords);

        const payload = { ...formData };

        if (existingCoords) {
          payload.coords = existingCoords;
          payload.position = existingCoords;
        } else {
          delete payload.coords;
          delete payload.position;
        }

        const result = await updatePOI(editingPOI.id, payload);
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
      } else if (pendingLocation && pendingLocation?.lat != null && pendingLocation?.lng != null) {
        const poiData = {
          ...formData,
          coords: [pendingLocation?.lat, pendingLocation?.lng],
          position: [pendingLocation?.lat, pendingLocation?.lng],
          user_id: id,
          is_approved: true // Admin POIs are auto-approved
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
    // Exit suggest mode when form is cancelled
    setIsSuggestMode(false);
  };

  const handleRemovePOI = async (poiId) => {
    const confirmed = await confirm("Are you sure you want to delete this POI?");
    if (confirmed) {
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
    // Admin can click markers to edit them directly
    handleEditPOI(marker);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <InteractiveMapLayout
        pois={pois}
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
        isAdmin={true}
        userMarkerCount={pois.filter(poi => poi.user_id === user.id).length}
        maxMarkers={Infinity}
        canCreateMore={true}
        onSuggestLocation={handleSuggestLocation}
        isSuggestMode={isSuggestMode}
        onAddNote={handleAddNote}
        isNoteMode={isNoteMode}
        onExitNoteMode={() => setIsNoteMode(false)}
        onExitSuggestMode={() => setIsSuggestMode(false)}
      />

      {/* Floating Action Button to go back to Dashboard */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, left: 16,
          display: { xs: 'flex', sm: 'flex', md: 'none' }
         }}
        onClick={() => navigate('/admin')}
      >
        <Tooltip title="Back to Dashboard">
          <DashboardIcon />
        </Tooltip>
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

export default AdminMap;
