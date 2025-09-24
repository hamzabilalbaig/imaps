import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import L from "leaflet";
import { 
  Box, 
  Typography, 
  Container,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Drawer,
  Fab,
  Paper
} from "@mui/material";
import { 
  Menu as MenuIcon,
  Close as CloseIcon,
  Notes as NotesIcon,
  ChevronRight,
  ChevronLeft
} from '@mui/icons-material';
import MapWithLayers from './MapWithLayers';
import MapClickHandler from './MapClickHandler';
import MapMarker from './MapMarker';
import MapNote from './MapNote';
import Sidebar from './Sidebar';
import AdSection from './AdSection';
import ProgressTracker from './ProgressTracker';
import POIForm from './POIForm';
import NoteForm from './NoteForm';
import MyPOIForm from './MyPOIForm';
import EditMyPOIForm from './EditMyPOIForm';
import LoginDialog from './LoginDialog';
import { MAP_CONFIG, parsePOIFromURL } from '../utils/mapUtils';
import { addUserNote, createAdminNote, getMyPOIs, getUserNotes, getMyPOISubcategories } from '../api/functions/apiFunctions';
import localDB from '../utils/localStorage';
import useUserStore from '../stores/user';
import usePOIsStore from '../stores/pois';

function InteractiveMapLayout(props) {
  const {
    pois = [],
    subCategories = [],
    userMarkerCount = 0,
    maxMarkers = Infinity,
    canCreateMore = true,
    onMapClick,
    onMarkerClick,
    onMarkerEdit,
    onMarkerRemove,
    showForm,
    editingPOI,
    pendingLocation,
    onSavePOI,
    onCancelForm,
    
    isAdmin = false,
    readOnly = false,
    onSuggestLocation,
    isSuggestMode = false,
    onAddNote,
    isNoteMode = false,
    onAddPOI,
    isPOIMode = false,
    onMyPOIMapClickRegister,
    isMyPOIMapClickMode = false,
    onExitNoteMode,
    onExitPOIMode,
    onExitSuggestMode
  } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const user = useUserStore(state => state);
  const { warning } = useAlerts();
  // Initialize left sidebar open for all users on desktop (just like right sidebar logic)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => {
    try {
      return !isMobile;
    } catch (e) {
      return !isMobile;
    }
  });
  // Initialize right sidebar open for all users on desktop (both logged in and non-logged-in)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    try {
      return !isMobile;
    } catch (e) {
      return !isMobile;
    }
  });
  const [visibleCategories, setVisibleCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // Hide ads for unlimited users and admins
  const [showAd, setShowAd] = useState(!(user?.plan === 'unlimited' || user?.role === 'admin'));
  const [notes, setNotes] = useState([]);
  const [progressTrackerMinimized, setProgressTrackerMinimized] = useState(false);
  const [streetsVisible, setStreetsVisible] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingNoteLocation, setPendingNoteLocation] = useState(null);
  const [showMyPOIForm, setShowMyPOIForm] = useState(false);
  const [showEditMyPOIForm, setShowEditMyPOIForm] = useState(false);
  const [editingMyPOI, setEditingMyPOI] = useState(null);
  const [pendingPOILocation, setPendingPOILocation] = useState(null);
  const [hideAll, setHideAll] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [focusedPOI, setFocusedPOI] = useState(null);
  const [myPois, setMyPOIs] = useState([]);
  const [myCategories, setMyCategories] = useState([]);

  const {id: currentUserId, fetchFoundLocations, foundLocations} = useUserStore()

 const fetchMyPOIs = async () => {
  const mypois = await getMyPOIs(currentUserId);
  setMyPOIs(mypois);
  // Also update the store's myPois
  const poisStore = usePOIsStore.getState();
  poisStore.fetchMyPOIs(currentUserId);
};

 const fetchMyCategories = async () => {
  const mycategories = await getMyPOISubcategories(currentUserId);
  console.log('My Categories:', mycategories)
  setMyCategories(mycategories)
 }

 // Handle POI edit - decide whether to use EditMyPOIForm or regular POIForm
 const handlePOIEdit = (poi) => {
   console.log('InteractiveMapLayout - handlePOIEdit:', {
     poi: poi,
     currentUserId: user?.id,
     poiUserId: poi.user_id,
     isAdmin: user?.isadmin,
     isUserOwnedPOI: poi.user_id === user?.id
   });
   
   // Check if this is user's own POI and they're not admin
   const isUserOwnedPOI = poi.user_id === user?.id;
   const isUserAdmin = user?.isadmin;
   
   if (isUserOwnedPOI && !isUserAdmin) {
     // Use EditMyPOIForm for user's own POIs
     console.log('InteractiveMapLayout - Opening EditMyPOIForm for user-owned POI');
     setEditingMyPOI(poi);
     setShowEditMyPOIForm(true);
   } else {
     // Use regular POIForm for admin edits or POI suggestions
     console.log('InteractiveMapLayout - Opening regular POIForm for admin/suggestion edit');
     if (onMarkerEdit) {
       onMarkerEdit(poi);
     }
   }
 };

 useEffect(()=>{
  if (currentUserId) {
    fetchMyPOIs();
    fetchMyCategories();
    fetchFoundLocations(); // Add found locations initialization
  }
 },[currentUserId]) // Remove user and fetchFoundLocations from dependencies to prevent infinite loop

  // New sidebar visibility state
  const [sidebarVisibilityState, setSidebarVisibilityState] = useState({
    hiddenCategories: new Set(),
    hiddenSubCategories: new Set(),
    globalVisibility: true
  });

  // New state for thank-you dialog
  const [thanksDialogOpen, setThanksDialogOpen] = useState(false);

  // New state for login dialog (for non-logged-in users)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Filter POIs based on visible subcategories and search
  const filteredPOIs = useMemo(() => {
    console.log('InteractiveMapLayout - Filtering POIs');
    console.log('InteractiveMapLayout - Input POIs:', pois?.length);
    console.log('InteractiveMapLayout - Sidebar visibility state:', sidebarVisibilityState);
    
    if (!sidebarVisibilityState.globalVisibility) {
      console.log('InteractiveMapLayout - Global visibility is false, hiding all POIs');
      return [];
    }
    
    const filtered = pois?.filter(poi => {
      // Find the subcategory for this POI
      const subCategory = subCategories.find(sub => sub.id === poi.sub_category_id);
      if (!subCategory) {
        console.log(`POI "${poi.name || poi.title}" - No subcategory found for sub_category_id: ${poi.sub_category_id}`);
        return false; // Hide POIs without subcategories
      }
      
      // Check if category is hidden
      const isCategoryHidden = sidebarVisibilityState.hiddenCategories.has(subCategory.category_id);
      
      // Check if subcategory is hidden
      const isSubCategoryHidden = sidebarVisibilityState.hiddenSubCategories.has(subCategory.id);
      
      // Check search term match
      const matchesSearch = !searchTerm || 
        poi.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        poi.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCategory.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const shouldShow = !isCategoryHidden && !isSubCategoryHidden && matchesSearch;
      
      if (poi.title || poi.name) {
        console.log(`POI "${poi.title || poi.name}" - Category Hidden: ${isCategoryHidden}, SubCategory Hidden: ${isSubCategoryHidden}, Matches Search: ${matchesSearch}, Show: ${shouldShow}`);
      }

      return shouldShow
    }) || [];
    
    console.log('InteractiveMapLayout - Filtered POIs:', filtered.length);
    console.log('InteractiveMapLayout - Filtered POIs Details:', filtered)
    console.log('InteractiveMapLayout - My POIs:', myPois)
    return [...filtered, ...myPois];
  }, [pois, subCategories, sidebarVisibilityState, searchTerm, myPois]);

  // Handle POI from URL parameter
  useEffect(() => {
    const poiFromURL = parsePOIFromURL();
    if (poiFromURL && poiFromURL?.lat && poiFromURL?.lng) {
      console.log('Focusing on POI from URL:', poiFromURL);
      setFocusedPOI(poiFromURL);
      
      // Wait for map to be available
      const checkMapAndTriggerClick = () => {
        if (window.leafletMap) {
          console.log('Map is available, triggering direct marker click');
          
          // First try with a small delay to ensure the map is fully loaded
          setTimeout(() => {
            try {
              window.leafletMap.fire('directMarkerClick', {
                latlng: L?.latLng(poiFromURL?.lat, poiFromURL?.lng)
              });
            } catch (error) {
              console.error('Error triggering marker click:', error);
            }
          }, 1500);
          
          // Try again with a larger delay as a fallback
          setTimeout(() => {
            try {
              window.leafletMap.fire('directMarkerClick', {
                latlng: L?.latLng(poiFromURL?.lat, poiFromURL?.lng)
              });
            } catch (error) {
              console.error('Error triggering marker click (retry):', error);
            }
          }, 3000);
        } else {
          console.log('Map not available yet, waiting...');
          setTimeout(checkMapAndTriggerClick, 500);
        }
      };
      
      checkMapAndTriggerClick();
      
      // Only clear the URL parameter after a longer delay
      setTimeout(() => {
        const url = new URL(window.location);
        url.searchParams.delete('poi');
        window.history.replaceState({}, '', url);
      }, 5000);
    }
  }, []);

  // Update showAd when user data changes
  useEffect(() => {
    setShowAd(!(user?.plan === 'unlimited' || user?.role === 'admin'));
  }, [user?.plan, user?.role]);

  // When focusing on a POI, try to find and highlight it
  useEffect(() => {
    if (focusedPOI && focusedPOI?.lat != null && focusedPOI?.lng != null && filteredPOIs.length > 0) {
      console.log('Looking for focused POI in filtered POIs:', focusedPOI);
      console.log('Available POIs:', filteredPOIs.map(poi => ({
        id: poi.id,
        position: poi.position || poi.coords,
        title: poi.title || poi.name,
        category: poi.category || poi.subcategory_name
      })));
      
      // Find matching POI for debugging
      const tolerances = [0.0001, 0.001, 0.01, 0.1];
      let matchingPOI = null;
      
      for (const tolerance of tolerances) {
        matchingPOI = filteredPOIs.find(poi => {
          const position = poi.position || poi.coords;
          
          // Handle different coordinate formats
          let lat, lng;
          if (Array.isArray(position)) {
            lat = position[0];
            lng = position[1];
          } else if (typeof position === 'string') {
            const coords = position.split(',').map(coord => parseFloat(coord.trim()));
            lat = coords[0];
            lng = coords[1];
          } else {
            return false;
          }
          
          const latDiff = Math.abs(lat - focusedPOI?.lat);
          const lngDiff = Math.abs(lng - focusedPOI?.lng);
          
          console.log('Comparing with tolerance', tolerance, ':', { 
            poiId: poi.id,
            poiTitle: poi.title || poi.name,
            poiLat: lat, 
            poiLng: lng, 
            focusedLat: focusedPOI?.lat, 
            focusedLng: focusedPOI?.lng,
            latDiff,
            lngDiff,
            matches: latDiff < tolerance && lngDiff < tolerance
          });
          
          return latDiff < tolerance && lngDiff < tolerance;
        });
        
        if (matchingPOI) {
          console.log('Found matching POI with tolerance', tolerance, ':', matchingPOI);
          console.log('This POI should have its popup auto-opened via isFocused prop');
          
          // Directly try to open the popup using onMarkerClick as a fallback
          if (onMarkerClick) {
            console.log('Also triggering marker click as a fallback');
            
            // Try multiple times with increasing delays
            [500, 1500, 3000, 5000].forEach(delay => {
              setTimeout(() => {
                onMarkerClick(matchingPOI);
              }, delay);
            });
          }
          
          break;
        }
      }
      
      if (!matchingPOI) {
        console.log('No matching POI found in current filtered POIs - the map will center but no popup will open');
      }
    }
  }, [focusedPOI, filteredPOIs, onMarkerClick]);

  const handleCategoryToggle = (category) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleShowAll = () => {
    // Legacy functionality - can be removed since sidebar handles this now
    setHideAll(false);
  };

  const handleHideAll = () => {
    // Legacy functionality - can be removed since sidebar handles this now
    setHideAll(true)
  };

  const handleSidebarVisibilityChange = (visibilityState) => {
    console.log('InteractiveMapLayout - Sidebar visibility changed:', visibilityState);
    setSidebarVisibilityState(visibilityState);
  };

  const handleAddNote = () => {
    // Check note limits before enabling note mode (only for non-admin users)
    if (user?.role !== 'admin') {
      const currentUserPlan = user?.plan || 'free';
      const planLimits = user?.planLimits?.[currentUserPlan];
      const currentNotesCount = notes?.length || 0;
      const canCreateMoreNotes = currentNotesCount < (planLimits?.maxNotes || 0);
      
      if (!canCreateMoreNotes) {
        // Silently prevent note creation when limit is reached
        return;
      }
    }
    
    setShowNoteForm(false);
    setEditingNote(null);
    setPendingNoteLocation(null);
    // Trigger note mode instead of directly adding a note
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleAddPOI = () => {
    setShowMyPOIForm(false);
    setPendingPOILocation(null);
    // Trigger POI mode instead of directly adding a POI
    if (onAddPOI) {
      onAddPOI();
    }
  };

  const handleNoteMapClick = (latlng) => {
    // Check if user is logged in
    if (!user?.id) {
      setLoginDialogOpen(true);
      return;
    }

    // Check note limits before allowing note creation (only for non-admin users)
    if (user.role !== 'admin') {
      const currentUserPlan = user?.plan || 'free';
      const planLimits = user?.planLimits?.[currentUserPlan];
      const currentNotesCount = notes?.length || 0;
      const canCreateMoreNotes = currentNotesCount < (planLimits?.maxNotes || 0);
      
      if (!canCreateMoreNotes) {
        // Silently prevent note creation when limit is reached
        return;
      }
    }
    
    setPendingNoteLocation(latlng);
    setEditingNote(null);
    setShowNoteForm(true);
  };

  const handlePOIMapClick = (latlng) => {
    // Check if user is logged in
    if (!user?.id) {
      setLoginDialogOpen(true);
      return;
    }

    // Check My POI limits before allowing map click
    const currentUserPlan = user?.plan || 'free';
    const planLimits = user?.planLimits?.[currentUserPlan];
    const currentMyPOIsCount = myPois?.length || 0;
    const canCreateMoreMyPOIs = currentMyPOIsCount < (planLimits?.totalPOILimit || 0);
    
    if (!canCreateMoreMyPOIs) {
      warning(`You have reached your My POI limit (${currentMyPOIsCount}/${planLimits?.totalPOILimit || 0}). Please upgrade your plan to add more POIs.`);
      return;
    }
    
    setPendingPOILocation(latlng);
    setShowMyPOIForm(true);
  };

  const handleSuggestMapClick = (latlng) => {
    // Check if user is logged in
    if (!user?.id) {
      setLoginDialogOpen(true);
      return;
    }

    // Call the original onMapClick function
    if (onMapClick) {
      onMapClick(latlng);
    }
  };

  const handleSaveNote = async (formData) => {
    if (user.role !== 'admin') {
      if (editingNote) {
        // Update existing note
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id 
            ? { ...note, ...formData, updatedAt: new Date().toISOString() }
            : note
        ));
      } else if (pendingNoteLocation && typeof pendingNoteLocation.lat === 'number' && typeof pendingNoteLocation.lng === 'number') {
        // Check note limits before creating new note
        const currentUserPlan = user?.plan || 'free';
        const planLimits = user?.planLimits?.[currentUserPlan];
        const currentNotesCount = notes?.length || 0;
        const canCreateMoreNotes = currentNotesCount < (planLimits?.maxNotes || 0);
        
        if (!canCreateMoreNotes) {
          // Silently prevent note creation when limit is reached
          handleCancelNoteForm();
          return;
        }
        
        // Create new note only if location is valid
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: [pendingNoteLocation.lat, pendingNoteLocation.lng],
          coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation.lng.toFixed(6)}`,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setNotes(prev => [...prev, newNote]);
        const data = await addUserNote(user.id, newNote);
        console.log('Added user note:', data);

      } else {
        // Invalid location, do not create note
        console.error('Cannot create note: pendingNoteLocation is missing or invalid.');
        handleCancelNoteForm();
        return;
      }
    } else {
      // For admin, ensure position and coords are present in formData
      let { id, title, content, tags, position, coords, color, userId } = formData;
      if ((!position || !coords) && pendingNoteLocation && typeof pendingNoteLocation.lat === 'number' && typeof pendingNoteLocation.lng === 'number') {
        position = [pendingNoteLocation.lat, pendingNoteLocation.lng];
        coords = `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation.lng.toFixed(6)}`;
      }
      if (!position || !coords) {
        console.error('Cannot create admin note: position or coords missing.');
        handleCancelNoteForm();
        return;
      }
      const data = await createAdminNote({
        id,
        title,
        content,
        tags,
        position,
        coords,
        color,
        userId
      });
      console.log('Created admin note:', data);
      localStorage.setItem('imaps_admin_notes', JSON.stringify([...JSON.parse(localStorage.getItem('imaps_admin_notes') || '[]'), data]));
      setNotes(prev => [...prev, data]);
    }
    handleCancelNoteForm();
  };

  const handleCancelNoteForm = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    setPendingNoteLocation(null);
    // Exit note mode when note form is cancelled
    if (onExitNoteMode) {
      onExitNoteMode();
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setPendingNoteLocation(null);
    setShowNoteForm(true);
  };

  const handleRemoveNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleFoundLocationClick = (locationData) => {
    const { lat, lng, poi } = locationData;
    
    console.log('Found location clicked:', locationData);
    
    // Check if this POI is in the main POIs list or My POIs
    const allAvailablePOIs = [...(filteredPOIs || []), ...(myPois || [])];
    const matchingPOI = allAvailablePOIs.find(p => p.id === (poi.poi_id || poi.id));
    
    if (matchingPOI) {
      console.log('POI found in available POIs, centering and opening popup');
      // POI is available, center and try to open popup
      if (window.leafletMap) {
        window.leafletMap.setView([lat, lng], 15);
        // Wait a bit longer to ensure map has moved
        setTimeout(() => {
          window.leafletMap.fire('directMarkerClick', {
            latlng: L?.latLng(lat, lng)
          });
        }, 800);
      }
    } else {
      console.log('POI not found in available POIs - might be hidden by filters');
      // POI might be hidden by category filters
      // Just center the map and let user know they might need to adjust filters
      if (window.leafletMap) {
        window.leafletMap.setView([lat, lng], 15);
      }
      
      // Could show a toast message here in the future
      console.log('Tip: If you don\'t see the POI, try adjusting your category filters');
    }
  };

  const handlePendingPOIClick = (locationData) => {
    const { lat, lng, poi } = locationData;
    
    console.log('Pending POI clicked:', locationData);
    
    // For admin users, pending POIs should be in the pois array (since admins see all POIs)
    // Navigate to the POI and try to open its popup
    if (window.leafletMap) {
      window.leafletMap.setView([lat, lng], 15);
      // Wait a bit for map to move, then trigger marker click
      setTimeout(() => {
        window.leafletMap.fire('directMarkerClick', {
          latlng: L?.latLng(lat, lng)
        });
      }, 800);
    }
  };

  const handleStreetsToggle = () => {
    setStreetsVisible(prev => !prev);
  };

  useEffect(() => {
    localDB?.initializeDB();
    
    // Only fetch notes if user is logged in and has a valid ID
    if (user && user.id) {
      getUserNotes(user.id)
        .then(data => {
          // Validate and filter notes with valid positions
          const validNotes = (data || []).filter(note => {
            if (!note.position || !Array.isArray(note.position) || note.position.length !== 2) {
              console.warn('Filtering out note with invalid position:', note.id, note.position);
              return false;
            }
            if (note.position[0] == null || note.position[1] == null || 
                isNaN(note.position[0]) || isNaN(note.position[1])) {
              console.warn('Filtering out note with invalid coordinates:', note.id, note.position);
              return false;
            }
            return true;
          });
          setNotes(validNotes);
        })
        .catch(err => {
          console.error('Failed to fetch user notes:', err);
          setNotes([]);
        });
    } else {
      // Initialize with empty notes array if user is not logged in
      setNotes([]);
    }
  }, [user]);

  // Keep right sidebar (progress tracker) open by default for all users until toggled off manually
  // Removed auto-close logic for non-authenticated users per user request

  useEffect(() => {
    console.log('Hidden categories updated:', hiddenCategories);
  }, [hiddenCategories]);
  

  const leftSidebarContent = (
    <Box sx={{ 
      height: '100%', 
      backgroundColor: 'background.paper',
      boxShadow: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}` 
      }}>
        <Link to={currentUserId ? "/map" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logos/logo-light.png" alt="iMaps Logo" style={{ height: isMobile ? 30 : 40, marginRight: 8 }} />

          <Typography variant="h6" color="textPrimary" sx={{ fontWeight: 'bold' }}>
            iMaps
          </Typography>
        </Link>
        <IconButton onClick={() => setLeftSidebarOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Sidebar
          pois={filteredPOIs}
          subCategories={subCategories}
          myCategories={myCategories}
          onMarkerClick={onMarkerClick}
          onCategoryToggle={handleCategoryToggle}
          visibleCategories={visibleCategories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onShowAll={handleShowAll}
          onHideAll={handleHideAll}
          streetsVisible={streetsVisible}
          onStreetsToggle={handleStreetsToggle}
          hiddenCategories={hiddenCategories}
          setHiddenCategories={setHiddenCategories}
          onVisibilityChange={handleSidebarVisibilityChange}
          onMapClick={onMyPOIMapClickRegister}
          onRefreshMyCategories={fetchMyCategories}
          onRefreshMyPOIs={fetchMyPOIs}
          onRefreshMySubCategories={fetchMyCategories}
          onPendingPOIClick={handlePendingPOIClick}
        />
      </Box>
    </Box>
  );

  const rightSidebarContent = (
    <ProgressTracker
      pois={filteredPOIs}
      subCategories={subCategories}
      notes={notes}
      foundLocations={foundLocations}
      onAddNote={handleAddNote}
      onEditNote={handleEditNote}
      onRemoveNote={handleRemoveNote}
      isMinimized={progressTrackerMinimized}
      onToggleMinimize={() => setProgressTrackerMinimized(!progressTrackerMinimized)}
      onClose={() => setRightSidebarOpen(false)}
      onSuggestLocation={onSuggestLocation}
      isSuggestMode={isSuggestMode}
      isNoteMode={isNoteMode}
      onAddPOI={handleAddPOI}
      isPOIMode={isPOIMode}
      readOnly={readOnly}
      isAdmin={isAdmin}
      userMarkerCount={isAdmin ? userMarkerCount : myPois.length }
      userCategoryCount={myCategories?.length}
      maxMarkers={maxMarkers}
      canCreateMore={canCreateMore}
      onFoundLocationClick={handleFoundLocationClick}
      showLoginDialog={loginDialogOpen}
      onLoginDialogClose={() => setLoginDialogOpen(false)}
      user={user}
    />
  );

  // Local handler for saving POI, wraps the onSavePOI prop
  const handleSavePOILocal = async (data) => {
    try {
      await onSavePOI(data);
      if (!isAdmin) {
        setThanksDialogOpen(true);
      }
    } catch (err) {
      console.error('Error saving POI:', err);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      position: 'relative',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Desktop Left Sidebar - exactly like right sidebar but on left */}
      {!isMobile && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: { lg: 320, xl: 350 },
          maxWidth: 400,
          maxHeight: '100%',
          zIndex: 1000,
          // Keep in DOM and slide
          transform: leftSidebarOpen ? 'translateX(0)' : 'translateX(-110%)',
          transition: 'transform 300ms ease',
          pointerEvents: leftSidebarOpen ? 'auto' : 'none',
          height: '100%',
        }}>
          {leftSidebarContent}
        </Box>
      )}

      {/* Desktop Left Sidebar Toggle Button */}
      {!isMobile && !leftSidebarOpen && (
        <Fab
          color="primary"
          size="medium"
          onClick={() => setLeftSidebarOpen(true)}
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      {/* Mobile Left Drawer */}
      {isMobile && (
        <>
          <Drawer
            anchor="left"
            open={leftSidebarOpen}
            onClose={() => setLeftSidebarOpen(false)}
            variant="temporary"
            sx={{
              '& .MuiDrawer-paper': {
                width: { xs: '85vw', sm: '70vw', md: 320 },
                maxWidth: 400,
                height: '100%',
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: 2, 
              borderBottom: `1px solid ${theme.palette.divider}` 
            }}>
              <Link to={currentUserId ? "/map" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img src="/logos/logo-light.png" alt="iMaps Logo" style={{ height: isMobile ? 30 : 40, marginRight: 8 }} />
              </Link>
              <IconButton onClick={() => setLeftSidebarOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {leftSidebarContent}
          </Drawer>

          {/* Mobile Menu Button */}
          <Fab
            color="primary"
            size="medium"
            onClick={() => setLeftSidebarOpen(true)}
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 20, md: 20 },
              left: { xs: 16, sm: 20, md: 20 },
              zIndex: 1000
            }}
          >
            <MenuIcon />
          </Fab>
        </>
      )}

      {/* Main Map Area */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative', 
        height: '100%',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',

      }}>
        <MapWithLayers
          center={focusedPOI && focusedPOI?.lat != null && focusedPOI?.lng != null ? [focusedPOI?.lat, focusedPOI?.lng] : MAP_CONFIG?.defaultCenter}
          zoom={focusedPOI && focusedPOI?.lat != null && focusedPOI?.lng != null ? 15 : MAP_CONFIG?.defaultZoom}
          showLayerSelector={true}
          layerSelectorPosition="bottom-center"
          isAdmin={isAdmin}
          streetsVisible={streetsVisible}
          // className={JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'atlas' ? 'atlas-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'road' ? 'road-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'satellite' ? 'satellite-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'uv' ? 'uv-image' : 'default-image !border-[0px]'}
          className="w-full h-full !border-[0px] !rounded-none"
          isRightSidebarVisible={rightSidebarOpen}
          onAddPOI={handleAddPOI}
        >
          {/* Map Click Handler - Allow non-logged-in users to use suggest mode */}
          {(isSuggestMode || isNoteMode || isPOIMode || isMyPOIMapClickMode) && (
            <MapClickHandler onMapClick={
              isPOIMode ? handlePOIMapClick : 
              (isNoteMode ? handleNoteMapClick : handleSuggestMapClick)
            } />
          )}
          
          {/* POI Markers */}
          {filteredPOIs.map((poi) => {
            // Validate POI coordinates before rendering
            const position = poi.position || poi.coords;
            if (!position || (!Array.isArray(position) && typeof position !== 'string')) {
              console.warn('Skipping POI with invalid position:', poi.id, position);
              return null;
            }
            
            // For array positions, validate elements
            if (Array.isArray(position)) {
              if (position.length !== 2 || position[0] == null || position[1] == null || 
                  isNaN(position[0]) || isNaN(position[1])) {
                console.warn('Skipping POI with invalid array position:', poi.id, position);
                return null;
              }
            }
            
            // Check if this POI is the focused one
            let isFocused = false;
            
            if (focusedPOI && focusedPOI?.lat != null && focusedPOI?.lng != null) {
              const position = poi.position || poi.coords;
              let lat, lng;
              
              if (Array.isArray(position)) {
                lat = position[0];
                lng = position[1];
              } else if (typeof position === 'string') {
                const coords = position.split(',').map(coord => parseFloat(coord.trim()));
                lat = coords[0];
                lng = coords[1];
              }
              
              if (lat !== undefined && lng !== undefined) {
                // Use multiple tolerance levels (from smallest to largest)
                const tolerances = [0.0001, 0.001, 0.01, 0.1];
                
                for (const tolerance of tolerances) {
                  if (Math.abs(lat - focusedPOI?.lat) < tolerance && 
                      Math.abs(lng - focusedPOI?.lng) < tolerance) {
                    isFocused = true;
                    console.log(`POI ${poi.id} is focused with tolerance ${tolerance}`);
                    console.log('POI position:', [lat, lng], 'Focus position:', [focusedPOI?.lat, focusedPOI?.lng]);
                    break;
                  }
                }
              }
            }
            
            return (
              <MapMarker
                key={poi.id}
                poi={poi}
                subCategories={[...subCategories, ...myCategories]}
                onRemove={onMarkerRemove}
                onEdit={handlePOIEdit}
                isAdmin={ user?.isadmin }
                canEdit={user?.isadmin || poi.user_id === user?.id}
                isFocused={isFocused}
              />
            );
          })}
          {/* Notes */}
          {!hideAll && (
            user?.isadmin ?
              JSON.parse(localStorage.getItem('imaps_admin_notes') || '[]')
                .filter(note => {
                  // Validate admin note positions
                  if (!note.position || !Array.isArray(note.position) || note.position.length !== 2) {
                    console.warn('Filtering out admin note with invalid position:', note.id, note.position);
                    return false;
                  }
                  if (note.position[0] == null || note.position[1] == null || 
                      isNaN(note.position[0]) || isNaN(note.position[1])) {
                    console.warn('Filtering out admin note with invalid coordinates:', note.id, note.position);
                    return false;
                  }
                  return true;
                })
                .map(note => (
                <MapNote
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onRemove={handleRemoveNote}
                  canEdit={isAdmin || note.userId === user?.id}
                />
              ))
              : notes?.map(note => (
                <MapNote
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onRemove={handleRemoveNote}
                  canEdit={true}
                />
              ))
          )}
          {/* Render admin notes to view only for user */}
          {/* {
            !hideAll && user?.role === 'user' &&
            JSON.parse(localStorage.getItem('imaps_admin_notes') || '[]').map(note => (
              <MapNote
                key={note.id}
                note={note}
                onEdit={() => {}}
                onRemove={() => {}}
                canEdit={false}
              />
            ))} */}
          
        </MapWithLayers>

  {/* Suggest Mode Indicator */}
  {isSuggestMode && !isAdmin && canCreateMore && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 999,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
              border: '3px solid',
              borderColor: 'primary.main',
              borderStyle: 'dashed',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                pointerEvents: 'auto',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <Typography variant="h6" fontWeight="bold" align="center" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '1rem'
              }}>
                📍 Suggest Mode Active
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.9 }}>
                Click anywhere on the map to suggest a new location
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Note Mode Indicator */}
        {isNoteMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 999,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
              border: '3px solid',
              borderColor: 'secondary.main',
              borderStyle: 'dashed',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 2,
                backgroundColor: 'secondary.main',
                color: 'white',
                borderRadius: 3,
                pointerEvents: 'auto',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <Typography variant="h6" fontWeight="bold" align="center" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '1rem'
              }}>
                📝 Note Mode Active
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.9 }}>
                Click anywhere on the map to add a new note
              </Typography>
            </Paper>
          </Box>
        )}

        {/* POI Mode Indicator */}
        {isPOIMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 999,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '3px solid',
              borderColor: 'warning.main',
              borderStyle: 'dashed',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 2,
                backgroundColor: 'warning.main',
                color: 'white',
                borderRadius: 3,
                pointerEvents: 'auto',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <Typography variant="h6" fontWeight="bold" align="center" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '1rem'
              }}>
                📍 POI Mode Active
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.9 }}>
                Click anywhere on the map to add a new POI
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Ad Section - Bottom Left */}
        {showAd && (
          <AdSection 
            onClose={() => setShowAd(false)}
            showCloseButton={true}
            // When desktop left sidebar is open, push the ad to the right so it isn't hidden behind the sidebar
            leftOffset={(!isMobile && leftSidebarOpen) ? 340 : 0}
          />
        )}

        {/* POI Form - Regular admin/suggestion form */}
        {showForm && (
          <POIForm
            poi={editingPOI || (pendingLocation ? { 
              coords: `${pendingLocation?.lat.toFixed(6)}, ${pendingLocation?.lng.toFixed(6)}` 
            } : null)}
            onSave={handleSavePOILocal}
            onCancel={onCancelForm}
            isEdit={!!editingPOI}
            isAdmin={isAdmin}
          />
        )}

        {/* Edit My POI Form - For editing user's own POIs */}
        {showEditMyPOIForm && (
          <EditMyPOIForm
            open={showEditMyPOIForm}
            poi={editingMyPOI}
            myCategories={myCategories}
            onClose={() => {
              setShowEditMyPOIForm(false);
              setEditingMyPOI(null);
            }}
            onSuccess={(updatedPOI) => {
              console.log('InteractiveMapLayout - POI updated successfully:', updatedPOI);
              // Refresh My POIs and categories to reflect changes
              fetchMyPOIs();
              fetchMyCategories();
              // Call the parent's onSave handler if available
              if (onSavePOI) {
                onSavePOI(updatedPOI);
              }
              setShowEditMyPOIForm(false);
              setEditingMyPOI(null);
            }}
          />
        )}

        {/* Note Form */}
        {showNoteForm && (
          <NoteForm
            note={editingNote || (pendingNoteLocation && pendingNoteLocation.lat != null && pendingNoteLocation.lng != null ? { 
              coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation.lng.toFixed(6)}` 
            } : null)}
            onSave={handleSaveNote}
            onCancel={handleCancelNoteForm}
            isEdit={!!editingNote}
          />
        )}

        {/* My POI Form */}
        {showMyPOIForm && (
          <MyPOIForm
            open={showMyPOIForm}
            onClose={() => {
              setShowMyPOIForm(false);
              setPendingPOILocation(null);
              // Exit POI mode when My POI form is closed
              if (onExitPOIMode) {
                onExitPOIMode();
              }
            }}
            mapClickCoords={pendingPOILocation}
            myPois={myPois}
            myCategories={myCategories}
            onSuccess={(newPOI) => {
              console.log('My POI created successfully:', newPOI);
              setShowMyPOIForm(false);
              setPendingPOILocation(null);
              // Exit POI mode when My POI is successfully created
              if (onExitPOIMode) {
                onExitPOIMode();
              }
              // Refresh My POIs and categories on the map
              fetchMyPOIs();
              fetchMyCategories();
            }}
          />
        )}

        {/* Progress Tracker Overlay - Desktop */}
        {!isMobile && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: { lg: 320, xl: 350 },
            maxWidth: 400,
            maxHeight: '100%',
            zIndex: 1000,
            // Keep in DOM and slide
            transform: rightSidebarOpen ? 'translateX(0)' : 'translateX(110%)',
            transition: 'transform 300ms ease',
            pointerEvents: rightSidebarOpen ? 'auto' : 'none',
            height: '100%',
          }}>
            {rightSidebarContent}
          </Box>
        )}

  {/* Desktop Progress Tracker Toggle Button */}
  {!isMobile && !rightSidebarOpen && (
          <Fab
            color="secondary"
            size="medium"
            onClick={() => setRightSidebarOpen(true)}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 1000
            }}
          >
            <NotesIcon />
          </Fab>
        )}
      </Box>

      {/* Mobile Right Drawer */}
      {isMobile && (
      <Drawer
        anchor="right"
        open={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
          variant="temporary"
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '85vw', sm: '70vw', md: 320 },
              maxWidth: 400,
              height: '100%',
              overflow: 'hidden'
            }
          }}
        >
          {rightSidebarContent}
        </Drawer>
      )}

      {/* Mobile Right Sidebar Toggle Button */}
      {isMobile && !rightSidebarOpen && (
        <Fab
          color="secondary"
          size="medium"
          onClick={() => {
            setRightSidebarOpen(true);
          }}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          <NotesIcon />
        </Fab>
      )}

      {/* Thank-you dialog for suggestions */}
      <Dialog open={thanksDialogOpen} onClose={() => setThanksDialogOpen(false)}>
        <DialogTitle>Thank you!</DialogTitle>
        <DialogContent>
          <Typography>Thanks for your suggestion! It will be reviewed by the administration.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThanksDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Login Dialog for non-logged-in users */}
      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => {
          setLoginDialogOpen(false);
          // Optionally reload the page or update user state
          window.location.reload();
        }}
      />
    </Box>
  );
}

export default InteractiveMapLayout;
