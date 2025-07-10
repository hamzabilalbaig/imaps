import React, { useState } from 'react';
import { 
  Box, 
  useTheme, 
  useMediaQuery,
  Drawer,
  IconButton,
  Fab,
  Paper,
  Typography
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Close as CloseIcon,
  Notes as NotesIcon
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
import { MAP_CONFIG } from '../utils/mapUtils';

function InteractiveMapLayout({
  markers = [],
  onMapClick,
  onMarkerClick,
  onMarkerEdit,
  onMarkerRemove,
  showForm,
  editingPOI,
  pendingLocation,
  onSavePOI,
  onCancelForm,
  user,
  isAdmin = false,
  userMarkerCount = 0,
  maxMarkers = 5,
  canCreateMore = true,
  onSuggestLocation,
  isSuggestMode = false,
  onAddNote,
  isNoteMode = false
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [visibleCategories, setVisibleCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAd, setShowAd] = useState(true);
  const [notes, setNotes] = useState([]);
  const [progressTrackerMinimized, setProgressTrackerMinimized] = useState(false);
  const [streetsVisible, setStreetsVisible] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingNoteLocation, setPendingNoteLocation] = useState(null);

  // Filter markers based on visible categories and search
  const filteredMarkers = markers.filter(marker => {
    const categoryVisible = visibleCategories[marker.category] !== false;
    const matchesSearch = !searchTerm || 
      marker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marker.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryVisible && matchesSearch;
  });

  const handleCategoryToggle = (category) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleShowAll = () => {
    const allCategories = [...new Set(markers.map(m => m.category || 'Other'))];
    const newVisible = {};
    allCategories.forEach(cat => {
      newVisible[cat] = true;
    });
    setVisibleCategories(newVisible);
  };

  const handleHideAll = () => {
    const allCategories = [...new Set(markers.map(m => m.category || 'Other'))];
    const newVisible = {};
    allCategories.forEach(cat => {
      newVisible[cat] = false;
    });
    setVisibleCategories(newVisible);
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

  const handleSaveNote = (formData) => {
    if (editingNote) {
      // Update existing note
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, ...formData, updatedAt: new Date().toISOString() }
          : note
      ));
    } else if (pendingNoteLocation) {
      // Create new note
      const newNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: [pendingNoteLocation.lat, pendingNoteLocation.lng],
        coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation.lng.toFixed(6)}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes(prev => [...prev, newNote]);
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

  const leftSidebarContent = (
    <Sidebar
      markers={markers}
      onMarkerClick={onMarkerClick}
      onCategoryToggle={handleCategoryToggle}
      visibleCategories={visibleCategories}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onShowAll={handleShowAll}
      onHideAll={handleHideAll}
      streetsVisible={streetsVisible}
      onStreetsToggle={handleStreetsToggle}
    />
  );

  const rightSidebarContent = (
    <ProgressTracker
      user={user}
      userMarkerCount={userMarkerCount}
      maxMarkers={maxMarkers}
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
      canCreateMore={canCreateMore}
      isAdmin={isAdmin}
    />
  );

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      position: 'relative',
      overflow: 'hidden',
      minHeight: 0
    }}>
      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <Box sx={{ 
          width: { lg: 320, xl: 350 }, 
          minWidth: 280,
          maxWidth: 400,
          height: '100%', 
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {leftSidebarContent}
        </Box>
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
                overflow: 'hidden'
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
        flexDirection: 'column'
      }}>
        <MapWithLayers
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          showLayerSelector={true}
          layerSelectorPosition="bottom-right"
          isAdmin={isAdmin}
          streetsVisible={streetsVisible}
        >
          {/* Map Click Handler */}
          {((canCreateMore && (isAdmin || isSuggestMode)) || isNoteMode) && (
            <MapClickHandler onMapClick={isNoteMode ? handleNoteMapClick : onMapClick} />
          )}
          
          {/* Markers */}
          {filteredMarkers.map((marker) => (
            <MapMarker
              key={marker.id}
              marker={marker}
              onRemove={onMarkerRemove}
              onEdit={onMarkerEdit}
              isAdmin={isAdmin}
              canEdit={isAdmin || marker.userId === user?.id}
            />
          ))}
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
          />
        )}

        {/* POI Form */}
        {showForm && (
          <POIForm
            poi={editingPOI || (pendingLocation ? { 
              coords: `${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}` 
            } : null)}
            onSave={onSavePOI}
            onCancel={onCancelForm}
            isEdit={!!editingPOI}
            isAdmin={isAdmin}
          />
        )}

        {/* Note Form */}
        {showNoteForm && (
          <NoteForm
            note={editingNote || (pendingNoteLocation ? { 
              coords: `${pendingNoteLocation.lat.toFixed(6)}, ${pendingNoteLocation.lng.toFixed(6)}` 
            } : null)}
            onSave={handleSaveNote}
            onCancel={handleCancelNoteForm}
            isEdit={!!editingNote}
          />
        )}

        {/* Progress Tracker Overlay - Desktop */}
        {!isMobile && rightSidebarOpen && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: { lg: 320, xl: 350 },
            maxWidth: 400,
            maxHeight: '100%',
            zIndex: 1000,
            pointerEvents: 'auto',
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
      {isMobile && (
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
  );
}

export default InteractiveMapLayout;
