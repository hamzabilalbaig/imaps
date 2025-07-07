import React, { useState } from "react";
import { 
  Box, 
  Alert, 
  AlertTitle, 
  Typography, 
  useTheme, 
  useMediaQuery,
  Snackbar,
  Button,
  Chip
} from "@mui/material";
import { 
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Upgrade as UpgradeIcon
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import MapMarker from "./MapMarker";
import MapWithLayers from "./MapWithLayers";
import MapClickHandler from "./MapClickHandler";
import POIForm from "./POIForm";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { useAuth } from "../contexts/AuthContext";
import { MAP_CONFIG } from "../utils/mapUtils";

/**
 * Public Map component - now allows users to create POIs within their plan limits
 */
function PublicMap() {
  const { 
    markers, 
    addMarker, 
    updateMarker, 
    removeMarker, 
    getUserMarkerCount,
    canCreateMore,
    remainingPOIs
  } = useMapMarkers();
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleMapClick = (latlng) => {
    if (!canCreateMore) {
      setSnackbar({
        open: true,
        message: `You've reached your POI limit (${getUserMarkerCount()}). Upgrade your plan to create more.`,
        severity: 'warning'
      });
      return;
    }
    
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
    removeMarker(poiId);
    setSnackbar({
      open: true,
      message: 'POI removed successfully!',
      severity: 'success'
    });
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Alert 
        severity="info" 
        icon={<VisibilityIcon />}
        sx={{ 
          m: { xs: 1, md: 2 }, 
          mb: { xs: 0.5, md: 1 }
        }}
        action={
          !canCreateMore && !isAdmin ? (
            <Button 
              component={Link} 
              to="/pricing" 
              color="inherit" 
              size="small"
              startIcon={<UpgradeIcon />}
            >
              Upgrade
            </Button>
          ) : null
        }
      >
        <AlertTitle sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
          {isAdmin ? 'Admin View' : 'Public View'}
        </AlertTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            {isAdmin 
              ? `Managing all POIs (${markers.length} total)`
              : `Your POIs: ${getUserMarkerCount()}`
            }
          </Typography>
          {!isAdmin && (
            <>
              <Chip 
                label={`${remainingPOIs === Infinity ? '∞' : remainingPOIs} remaining`}
                size="small"
                color={remainingPOIs > 0 ? 'success' : 'error'}
                variant="outlined"
              />
              {canCreateMore && (
                <Chip 
                  icon={<AddIcon />}
                  label="Click map to add POI"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </>
          )}
        </Box>
      </Alert>

      <Box sx={{ 
        flex: 1, 
        position: 'relative', 
        mx: { xs: 1, md: 2 }, 
        mb: { xs: 1, md: 2 }
      }}>
        <MapWithLayers
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          showLayerSelector={true}
          layerSelectorPosition="top-right"
          isAdmin={false}
        >
          {/* Regular users can now add POIs within their limits */}
          <MapClickHandler onMapClick={handleMapClick} />
          
          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              marker={marker}
              onRemove={handleRemovePOI}
              onEdit={handleEditPOI}
              isAdmin={isAdmin}
              canEdit={isAdmin || marker.userId === user?.id}
            />
          ))}
        </MapWithLayers>

        {/* POI Form */}
        {showForm && (
          <POIForm
            poi={editingPOI || (pendingLocation ? { coords: `${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}` } : null)}
            onSave={handleSavePOI}
            onCancel={handleCancelForm}
            isEdit={!!editingPOI}
          />
        )}
      </Box>

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

export default PublicMap;
