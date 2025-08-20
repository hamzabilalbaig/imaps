import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { MAP_CONFIG, parsePOIFromURL } from '../utils/mapUtils';
import { addUserNote, createAdminNote, getUserNotes } from '../api/functions/apiFunctions';
import localDB from '../utils/localStorage';
import useUserStore from '../stores/user';

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
    isNoteMode = false
  } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const user = useUserStore(state => state);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  // Initialize right sidebar open only for authenticated users on desktop
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    try {
      return !isMobile && !!user?.id;
    } catch (e) {
      return !isMobile;
    }
  });
  const [visibleCategories, setVisibleCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAd, setShowAd] = useState(true);
  const [notes, setNotes] = useState([]);
  const [progressTrackerMinimized, setProgressTrackerMinimized] = useState(false);
  const [streetsVisible, setStreetsVisible] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingNoteLocation, setPendingNoteLocation] = useState(null);
  const [hideAll, setHideAll] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [focusedPOI, setFocusedPOI] = useState(null);

  // New sidebar visibility state
  const [sidebarVisibilityState, setSidebarVisibilityState] = useState({
    hiddenCategories: new Set(),
    hiddenSubCategories: new Set(),
    globalVisibility: true
  });

  // New state for thank-you dialog
  const [thanksDialogOpen, setThanksDialogOpen] = useState(false);

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

      return shouldShow;
    }) || [];
    
    console.log('InteractiveMapLayout - Filtered POIs:', filtered.length);
    return filtered;
  }, [pois, subCategories, sidebarVisibilityState, searchTerm]);

  // Handle POI from URL parameter
  useEffect(() => {
    const poiFromURL = parsePOIFromURL();
    if (poiFromURL) {
      console.log('Focusing on POI from URL:', poiFromURL);
      setFocusedPOI(poiFromURL);
      
      // Wait for map to be available
      const checkMapAndTriggerClick = () => {
        if (window.leafletMap) {
          console.log('Map is available, triggering direct marker click');
          
          // First try with a small delay to ensure the map is fully loaded
          setTimeout(() => {
            window.leafletMap.fire('directMarkerClick', {
              latlng: L.latLng(poiFromURL.lat, poiFromURL.lng)
            });
          }, 1500);
          
          // Try again with a larger delay as a fallback
          setTimeout(() => {
            window.leafletMap.fire('directMarkerClick', {
              latlng: L.latLng(poiFromURL.lat, poiFromURL.lng)
            });
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

  // When focusing on a POI, try to find and highlight it
  useEffect(() => {
    if (focusedPOI && filteredPOIs.length > 0) {
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
          
          const latDiff = Math.abs(lat - focusedPOI.lat);
          const lngDiff = Math.abs(lng - focusedPOI.lng);
          
          console.log('Comparing with tolerance', tolerance, ':', { 
            poiId: poi.id,
            poiTitle: poi.title || poi.name,
            poiLat: lat, 
            poiLng: lng, 
            focusedLat: focusedPOI.lat, 
            focusedLng: focusedPOI.lng,
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
    setShowNoteForm(false);
    setEditingNote(null);
    setPendingNoteLocation(null);
    // Trigger note mode instead of directly adding a note
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleNoteMapClick = (latlng) => {
    setPendingNoteLocation(latlng);
    setEditingNote(null);
    setShowNoteForm(true);
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
      } else if (pendingNoteLocation && typeof pendingNoteLocation.lat === 'number' && typeof pendingNoteLocation?.lng === 'number') {
        // Create new note only if location is valid
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: [pendingNoteLocation.lat, pendingNoteLocation?.lng],
          coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation?.lng.toFixed(6)}`,
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
      if ((!position || !coords) && pendingNoteLocation && typeof pendingNoteLocation.lat === 'number' && typeof pendingNoteLocation?.lng === 'number') {
        position = [pendingNoteLocation.lat, pendingNoteLocation?.lng];
        coords = `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation?.lng.toFixed(6)}`;
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
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setPendingNoteLocation(null);
    setShowNoteForm(true);
  };

  const handleRemoveNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleStreetsToggle = () => {
    setStreetsVisible(prev => !prev);
  };

  useEffect(() => {
    localDB?.initializeDB();
    getUserNotes(user?.id)?.then(data => {
      setNotes(data || []);
    }).catch(err => {
      console.error('Failed to fetch user notes:', err);
      setNotes([]);
    });
  }, []);

  // Close right sidebar when user is not authenticated
  useEffect(() => {
    try {
      const authenticated = !!user?.id;
      if (!authenticated && rightSidebarOpen) {
        setRightSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error checking authentication for sidebar visibility', err);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('Hidden categories updated:', hiddenCategories);
  }, [hiddenCategories]);
  

  const leftSidebarContent = (
    <Sidebar
      pois={filteredPOIs}
      subCategories={subCategories}
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
    />
  );

  const rightSidebarContent = !readOnly && (
    <ProgressTracker
      pois={filteredPOIs}
      subCategories={subCategories}
      notes={notes}
      onAddNote={handleAddNote}
      onEditNote={handleEditNote}
      onRemoveNote={handleRemoveNote}
      isMinimized={progressTrackerMinimized}
      onToggleMinimize={() => setProgressTrackerMinimized(!progressTrackerMinimized)}
      onClose={() => setRightSidebarOpen(false)}
      onSuggestLocation={onSuggestLocation}
      isSuggestMode={isSuggestMode}
      isNoteMode={isNoteMode}
      readOnly={readOnly}
      isAdmin={isAdmin}
      userMarkerCount={userMarkerCount}
      maxMarkers={maxMarkers}
      canCreateMore={canCreateMore}
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
      {/* Desktop Left Sidebar (overlay) */}
      {!isMobile && (
        <>
        <Box sx={{ 
          width: { lg: 320, xl: 350 }, 
          minWidth: 280,
          maxWidth: 400,
          // Make the sidebar overlay the map instead of occupying layout space
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          zIndex: 1200,
          overflow: 'visible',
          // Keep the element in the DOM and slide it in/out for smooth animation
          transform: leftSidebarOpen ? 'translateX(0)' : 'translateX(-110%)',
          transition: 'transform 300ms ease',
          pointerEvents: leftSidebarOpen ? 'auto' : 'none',
          displayPrint: 'none'
        }}>
          <IconButton
            onClick={() => setLeftSidebarOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: -28,
              zIndex: 1000,
              display: leftSidebarOpen ? 'block' : 'none',
              backgroundColor: 'background.paper',
              borderRadius: '1px',
              "&:hover": {
                backgroundColor: 'background.paper'
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          {leftSidebarContent}
        </Box>
        <IconButton
          onClick={() => setLeftSidebarOpen(true)}
          sx={{ 
            position: 'absolute',
            // top: 100,
            top: 16,
            left: -15,
            zIndex: 1000,
            display: leftSidebarOpen ? 'none' : 'block',
             backgroundColor: 'background.paper',
              borderRadius: '1px',
              "&:hover": {
                backgroundColor: 'background.paper'
              }
          }}
        >
          <ChevronRight sx={{ml:1}} />
        </IconButton>
        </>
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
                // overflow: 'hidden'
              }
            }}
          >
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
          center={focusedPOI ? [focusedPOI.lat, focusedPOI.lng] : MAP_CONFIG?.defaultCenter}
          zoom={focusedPOI ? 15 : MAP_CONFIG?.defaultZoom}
          showLayerSelector={true}
          layerSelectorPosition="bottom-center"
          isAdmin={isAdmin}
          streetsVisible={streetsVisible}
          // className={JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'atlas' ? 'atlas-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'road' ? 'road-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'satellite' ? 'satellite-image' : JSON.parse(localStorage.getItem('map-layers') || '[]')?.find(layer => layer.isActive)?.id === 'uv' ? 'uv-image' : 'default-image !border-[0px]'}
          className="w-full h-full !border-[0px] !rounded-none"
          isRightSidebarVisible={rightSidebarOpen}
        >
          {/* Map Click Handler */}
          {((canCreateMore && isSuggestMode) || isNoteMode) && (
            <MapClickHandler onMapClick={isNoteMode ? handleNoteMapClick : onMapClick} />
          )}
          
          {/* POI Markers */}
          {filteredPOIs.map((poi) => {
            // Check if this POI is the focused one
            let isFocused = false;
            
            if (focusedPOI) {
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
                  if (Math.abs(lat - focusedPOI.lat) < tolerance && 
                      Math.abs(lng - focusedPOI.lng) < tolerance) {
                    isFocused = true;
                    console.log(`POI ${poi.id} is focused with tolerance ${tolerance}`);
                    console.log('POI position:', [lat, lng], 'Focus position:', [focusedPOI.lat, focusedPOI.lng]);
                    break;
                  }
                }
              }
            }
            
            return (
              <MapMarker
                key={poi.id}
                poi={poi}
                subCategories={subCategories}
                onRemove={onMarkerRemove}
                onEdit={onMarkerEdit}
                isAdmin={ user?.isadmin }
                canEdit={user?.isadmin || poi.user_id === user?.id}
                isFocused={isFocused}
              />
            );
          })}
          {/* Notes */}
          {!hideAll && (
            user?.isadmin ?
              JSON.parse(localStorage.getItem('imaps_admin_notes') || '[]').map(note => (
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
        {isSuggestMode && !isAdmin && (
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

        {/* Ad Section - Bottom Left */}
        {showAd && (
          <AdSection 
            onClose={() => setShowAd(false)}
            showCloseButton={true}
            // When desktop left sidebar is open, push the ad to the right so it isn't hidden behind the sidebar
            leftOffset={(!isMobile && leftSidebarOpen) ? 340 : 0}
          />
        )}

        {/* POI Form */}
        {showForm && (
          <POIForm
            poi={editingPOI || (pendingLocation ? { 
              coords: `${pendingLocation.lat.toFixed(6)}, ${pendingLocation?.lng.toFixed(6)}` 
            } : null)}
            onSave={handleSavePOILocal}
            onCancel={onCancelForm}
            isEdit={!!editingPOI}
            isAdmin={isAdmin}
          />
        )}

        {/* Note Form */}
        {showNoteForm && (
          <NoteForm
            note={editingNote || (pendingNoteLocation ? { 
              coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation?.lng.toFixed(6)}` 
            } : null)}
            onSave={handleSaveNote}
            onCancel={handleCancelNoteForm}
            isEdit={!!editingNote}
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

  {/* Desktop Progress Tracker Toggle Button (only show when user is logged in) */}
  {!isMobile && !rightSidebarOpen && user?.id && (
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
        open={rightSidebarOpen && !!user?.id}
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

      {/* Mobile Right Sidebar Toggle Button (only show for authenticated users) */}
      {isMobile && user?.id && (
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
    </Box>
  );
}

export default InteractiveMapLayout;
