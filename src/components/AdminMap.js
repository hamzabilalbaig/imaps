import React, { useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  Tabs,
  Tab,
  Typography,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
  Paper,
  AppBar
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  Layers as LayersIcon
} from "@mui/icons-material";
import MapClickHandler from "./MapClickHandler";
import MapMarker from "./MapMarker";
import MapControls from "./MapControls";
import POIForm from "./POIForm";
import POIList from "./POIList";
import LayerManager from "./LayerManager";
import MapWithLayers from "./MapWithLayers";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { MAP_CONFIG } from "../utils/mapUtils";

/**
 * Admin Map component with full editing capabilities
 */
function AdminMap() {
  const { markers, addMarker, updateMarker, removeMarker, clearAllMarkers } = useMapMarkers();
  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pois"); // "pois" or "layers"
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMapClick = (latlng) => {
    setPendingLocation(latlng);
    setEditingPOI(null);
    setShowForm(true);
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi);
    setPendingLocation(null);
    setShowForm(true);
  };

  const handleSavePOI = (formData) => {
    if (editingPOI) {
      // Update existing POI
      updateMarker(editingPOI.id, formData);
    } else if (pendingLocation) {
      // Add new POI
      addMarker(pendingLocation, formData);
    }
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleRemovePOI = (poiId) => {
    if (window.confirm("Are you sure you want to delete this POI?")) {
      removeMarker(poiId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all POIs? This action cannot be undone.")) {
      clearAllMarkers();
    }
  };

  const sidebarContent = (
    <Box sx={{ width: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Header */}
      {!isDesktop && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'grey.200' }}>
          <Typography variant="h6" fontWeight="bold">
            Admin Panel
          </Typography>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Tab Navigation */}
      <AppBar position="static" color="default" elevation={0}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
        >
          <Tab 
            value="pois" 
            label="POI Management" 
            icon={<LocationOnIcon />}
            iconPosition="start"
          />
          <Tab 
            value="layers" 
            label="Map Layers" 
            icon={<LayersIcon />}
            iconPosition="start"
          />
        </Tabs>
      </AppBar>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === "pois" && (
          <POIList
            markers={markers}
            onEdit={handleEditPOI}
            onRemove={handleRemovePOI}
            onClearAll={handleClearAll}
          />
        )}
        {activeTab === "layers" && (
          <Box sx={{ p: 2 }}>
            <LayerManager />
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      position: 'relative',
      flexDirection: { xs: 'column', lg: 'row' }
    }}>
      {/* Sidebar */}
      {isDesktop ? (
        <Paper 
          elevation={0} 
          sx={{ 
            width: { lg: 380, xl: 420 },
            minWidth: { lg: 380 },
            borderRight: 1, 
            borderColor: 'grey.200',
            height: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflow: 'hidden'
          }}
        >
          {sidebarContent}
        </Paper>
      ) : (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100vw', sm: '90vw', md: 480 },
              maxWidth: { xs: '100vw', sm: '90vw', md: 480 },
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Map Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, minHeight: 0 }}>
        <Alert 
          severity="info" 
          sx={{ 
            m: { xs: 0.5, sm: 1, md: 2 },
            borderRadius: { xs: 1, md: 2 },
            borderLeft: 4,
            borderLeftColor: 'primary.main'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            width: '100%',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Mobile Menu Button */}
              {!isDesktop && (
                <IconButton 
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 1 }}
                  color="primary"
                  size="small"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <AlertTitle sx={{ mb: 0, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Admin Mode:</strong>
                </AlertTitle>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  {isMobile ? 'Tap map to add POIs' : 'Click on the map to add new POIs. Use the sidebar to manage POIs and map layers.'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Alert>
        
        <MapControls markers={markers} onClearAll={handleClearAll} />

        <Box sx={{ flex: 1, position: 'relative' }}>
          <MapWithLayers
            center={MAP_CONFIG.defaultCenter}
            zoom={MAP_CONFIG.defaultZoom}
            showLayerSelector={true}
            layerSelectorPosition="top-right"
            isAdmin={true}
          >
            <MapClickHandler onMapClick={handleMapClick} />

            {markers.map((marker) => (
              <MapMarker
                key={marker.id}
                marker={marker}
                onRemove={handleRemovePOI}
                onEdit={handleEditPOI}
                isAdmin={true}
              />
            ))}
          </MapWithLayers>
        </Box>
      </Box>

      {/* POI Form Modal */}
      {showForm && (
        <POIForm
          poi={editingPOI || (pendingLocation ? { coords: `${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}` } : null)}
          onSave={handleSavePOI}
          onCancel={handleCancelForm}
          isEdit={!!editingPOI}
        />
      )}
    </Box>
  );
}

export default AdminMap;
