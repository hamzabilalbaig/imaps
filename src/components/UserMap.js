import React, { useState, useEffect, useRef } from 'react';
import { useAlerts } from '../hooks/useAlerts';
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
  const { pois, myPois, createPOI, updatePOI, deletePOI, initializePOIs, fetchMyPOIs } = usePOIsStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  const { id, name, email, role, plan, planLimits, initializeUser, isUserAdmin } = useUserStore();
  const { confirm } = useAlerts();

  useEffect(() => {
    const initializeData = async () => {
      await initializeUser();
      initializePOIs();
      initializeSubCategories();
    };
    
    initializeData();
    
    // Debug: Check for POI parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const poiParam = urlParams.get('poi');
    if (poiParam) {
      console.log('UserMap detected POI parameter:', poiParam);
    }
  }, []); // Only run once on mount

  // Fetch user's custom POIs when user ID is available
  useEffect(() => {
    if (id) {
      fetchMyPOIs(id);
    }
  }, [id, fetchMyPOIs]);

  const user = { id, name, email, role };
  const isAdmin = isUserAdmin();

  // Filter POIs for current user (admins see all, users see only approved POIs)
  const userPOIs = isAdmin ? 
    pois : 
    [
      ...pois.filter(poi => {
        // Only show approved POIs to normal users (not their own unapproved ones)
        const isApproved = poi.is_approved === true || poi.is_approved === 1 || poi.is_approved === 'true';
        return isApproved;
      }),
      ...myPois
    ];

  // Debug logging for POI filtering
  useEffect(() => {
    if (pois.length > 0) {
      console.log('UserMap - POI Filtering Debug:');
      console.log('- Total POIs from store:', pois.length);
      console.log('- User ID:', id);
      console.log('- Is Admin:', isAdmin);
      console.log('- Filtered POIs for user:', userPOIs.length);
      console.log('- My POIs count:', myPois.length);
      
      if (!isAdmin) {
        const approvedPOIs = pois.filter(poi => {
          const isApproved = poi.is_approved === true || poi.is_approved === 1 || poi.is_approved === 'true';
          return isApproved;
        });
        const unapprovedPOIs = pois.filter(poi => {
          const isApproved = poi.is_approved === true || poi.is_approved === 1 || poi.is_approved === 'true';
          return !isApproved;
        });
        
        console.log('- Approved POIs (visible):', approvedPOIs.length);
        console.log('- Unapproved POIs (hidden from all users):', unapprovedPOIs.length);
        
        if (unapprovedPOIs.length > 0) {
          console.log('- Hidden unapproved POIs:', unapprovedPOIs.map(p => ({
            id: p.id, 
            name: p.name, 
            user_id: p.user_id, 
            is_approved: p.is_approved,
            approval_type: typeof p.is_approved
          })));
        }
      }
    }
  }, [pois, userPOIs, myPois, id, isAdmin]);

  // Calculate POI limits for regular users based on user's plan
  const userOwnedPOIs = pois.filter(poi => poi.user_id === id);
  const userMarkerCount = userOwnedPOIs.length;
  const userPlanLimit = planLimits?.[plan]?.totalPOILimit || 0;
  
  // Separate limits for My POI creation vs Location suggestions
  const canCreateMyPOIs = isAdmin || (userPlanLimit === Infinity || userMarkerCount < userPlanLimit);
  const canSuggestLocations = true; // Location suggestions should always be allowed as they go through admin approval
  const canCreateMore = canCreateMyPOIs; // Keep existing behavior for backward compatibility
  
  const remainingPOIs = isAdmin ? Infinity : (userPlanLimit === Infinity ? Infinity : Math.max(0, userPlanLimit - userMarkerCount));

  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSuggestMode, setIsSuggestMode] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isPOIMode, setIsPOIMode] = useState(false);
  const [myPOIMapClickHandler, setMyPOIMapClickHandler] = useState(null);

  // If user hits their POI limit, clear any pending My POI creation but NOT location suggestions
  useEffect(() => {
    if (!canCreateMyPOIs && !isSuggestMode) {
      // Only clear pending location for My POI creation, not for location suggestions
      if (pendingLocation) {
        setPendingLocation(null);
        setSnackbar({
          open: true,
          message: 'My POI limit reached — pending POI cleared. You can still suggest locations for admin approval.',
          severity: 'warning'
        });
      }
    }
  }, [canCreateMyPOIs, pendingLocation, isSuggestMode]);

  const handleMapClick = (latlng) => {
    // Handle My POI map clicks first
    if (myPOIMapClickHandler) {
      myPOIMapClickHandler(latlng);
      return;
    }

    // Check if this is for location suggestions (always allowed) or My POI creation (limited)
    const isLocationSuggestion = isSuggestMode;
    const canProceed = isLocationSuggestion ? canSuggestLocations : canCreateMyPOIs;

    if (canProceed) {
      setPendingLocation(latlng);
      setEditingPOI(null);
      setShowForm(true);
      if (!isLocationSuggestion) {
        setIsSuggestMode(false);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'You have reached your My POI limit. Upgrade your plan to add more personal locations. You can still suggest locations for admin approval.',
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

  const handleAddPOI = () => {
    setIsPOIMode(!isPOIMode);
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
      } else if (pendingLocation && pendingLocation?.lat != null && pendingLocation?.lng != null) {
        const poiData = {
          ...formData,
          coords: [pendingLocation?.lat, pendingLocation?.lng],
          user_id: id,
          is_approved: isAdmin ? true : false // Admin POIs are auto-approved, user POIs need approval
        };
        
        console.log('UserMap - Creating POI with approval status:', {
          isAdmin,
          is_approved: poiData.is_approved,
          user_id: id
        });
        const result = await createPOI(poiData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: isAdmin ? 'POI created successfully!' : 'POI submitted for approval! It will be visible once approved by an admin.',
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
    // Exit suggest mode when POI form is cancelled
    setIsSuggestMode(false);
  };

  const handleRemovePOI = async (poiId) => {
    confirm("Are you sure you want to delete this POI?", async () => {
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
    });
  };

  const handleMarkerClick = (marker) => {
    // Check for URL parameter - if present, just let the popup show
    const urlParams = new URLSearchParams(window.location.search);
    const poiParam = urlParams.get('poi');
    
    if (!poiParam) {
      // Normal behavior - open edit form for user's own markers
      handleEditPOI(marker);
    } else {
      console.log('POI was opened from a shared link - showing popup only');
      // Do nothing, let the popup be displayed by MapMarker
    }
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
        maxMarkers={userPlanLimit}
        canCreateMore={canSuggestLocations} // Use canSuggestLocations for location suggestions (always true)
        onSuggestLocation={handleSuggestLocation}
        isSuggestMode={isSuggestMode}
        onAddNote={handleAddNote}
        isNoteMode={isNoteMode}
        onAddPOI={handleAddPOI}
        isPOIMode={isPOIMode}
        onMyPOIMapClickRegister={setMyPOIMapClickHandler}
        isMyPOIMapClickMode={!!myPOIMapClickHandler}
        onExitNoteMode={() => setIsNoteMode(false)}
        onExitPOIMode={() => setIsPOIMode(false)}
        onExitSuggestMode={() => setIsSuggestMode(false)}
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
