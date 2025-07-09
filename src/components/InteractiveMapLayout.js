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
import Sidebar from './Sidebar';
import AdSection from './AdSection';
import ProgressTracker from './ProgressTracker';
import POIForm from './POIForm';
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
  isSuggestMode = false
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
    const newNote = {
      id: Date.now(),
      title: `Note ${notes.length + 1}`,
      description: 'New note description',
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [...prev, newNote]);
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
      isMinimized={progressTrackerMinimized}
      onToggleMinimize={() => setProgressTrackerMinimized(!progressTrackerMinimized)}
      onClose={() => setRightSidebarOpen(false)}
      onSuggestLocation={onSuggestLocation}
      isSuggestMode={isSuggestMode}
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
          {canCreateMore && (isAdmin || isSuggestMode) && (
            <MapClickHandler onMapClick={onMapClick} />
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
      </Box>

      {/* Desktop Right Sidebar */}
      {!isMobile && rightSidebarOpen && (
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
          {rightSidebarContent}
        </Box>
      )}

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
