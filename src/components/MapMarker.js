import React, { useState, useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Stack,
  useTheme,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { generateShareableLink, createCategoryIcon } from "../utils/mapUtils";
import useUserStore from "../stores/user";
import useSettingsStore from "../stores/settings";

/**
 * Individual marker component with popup
 * @param {Object} poi - POI data object with new structure
 * @param {Object} marker - Legacy marker data object (for backward compatibility)
 * @param {Array} subCategories - Array of subcategories with icons
 * @param {Function} onRemove - Callback function to remove the POI/marker
 * @param {Function} onEdit - Callback function to edit the POI/marker
 * @param {boolean} isAdmin - Whether this is admin view with edit capabilities
 * @param {boolean} canEdit - Whether the current user can edit this POI/marker
 * @param {boolean} isFocused - Whether this POI is focused (from shareable link)
 */
function MapMarker({ poi, marker, subCategories = [], onRemove, onEdit, isFocused = false }) {
  const { isadmin: isAdmin, id: userId, isLocationFound, addToFoundLocations, removeFromFoundLocations } = useUserStore()
  const { success, warning } = useAlerts();
  const { poiIconSize } = useSettingsStore();
  
  const [isFound, setIsFound] = useState(false)
  const [foundLoading, setFoundLoading] = useState(false)
  const theme = useTheme();
  
  // Support both new POI structure and legacy marker structure
  const currentItem = poi || marker;
  
  // User can edit if they're admin OR if they own this POI
  const canEdit = isAdmin || (userId && currentItem?.user_id === userId)
  const isNewStructure = !!poi;
  
  // Get subcategory data for new structure
  const subCategory = isNewStructure ? 
    subCategories.find(sub => sub.id === poi.sub_category_id) : null;

  // Get display values based on structure
  const displayName = isNewStructure ? (poi.name || poi.title || "Untitled POI") : (marker?.title || "Untitled POI");
  const displayDescription = isNewStructure ? poi.description : marker?.description;
  const displayCategory = isNewStructure ? (subCategory?.name || poi.subcategory_name || "Unknown Category") : marker?.category;
  
  // Handle position/coordinates more robustly
  let position;
  if (isNewStructure) {
    if (poi.position && Array.isArray(poi.position)) {
      position = poi.position;
    } else if (poi.coords) {
      if (Array.isArray(poi.coords)) {
        position = poi.coords;
      } else if (typeof poi.coords === 'string') {
        // Parse string coordinates like "lat,lng"
        const coordParts = poi.coords.split(',').map(coord => parseFloat(coord.trim()));
        position = coordParts.length === 2 ? coordParts : null;
      }
    }
  } else {
    position = marker?.position;
  }
  
  const iconImageUrl = isNewStructure ? subCategory?.icon_image_url : null;
  const poiImageUrl = isNewStructure ? poi.image_url : null;

  // All useEffect hooks must be before any early returns
  useEffect(() => {
    console.log("MapMarker - isAdmin:", isAdmin);
  }, [isAdmin]);

  // Debug logging for new structure
  useEffect(() => {
    if (isNewStructure) {
      console.log('MapMarker - POI:', poi);
      console.log('MapMarker - SubCategory:', subCategory);
      console.log('MapMarker - Display Name:', displayName);
      console.log('MapMarker - Display Category:', displayCategory);
      console.log('MapMarker - Position:', position);
      console.log('MapMarker - Is Focused:', isFocused);
    }
  }, [poi, subCategory, isNewStructure, isFocused, displayName, displayCategory, position]);

    // Check if POI is found when component mounts or POI changes
  useEffect(() => {
    if (userId && currentItem?.id) {
      const found = isLocationFound(currentItem.id);
      setIsFound(found);
    }
  }, [userId, currentItem?.id, isLocationFound]);

  useEffect(() => {
    console.log("POI/Marker updated:", currentItem);
  }, [currentItem]);

  // Debug the POI structure and values
  useEffect(() => {
    if (isNewStructure) {
      console.log('MapMarker - Full POI object:', poi);
      console.log('MapMarker - poi.name:', poi.name);
      console.log('MapMarker - poi.title:', poi.title);  
      console.log('MapMarker - subCategory:', subCategory);
      console.log('MapMarker - Position format:', position, typeof position, Array.isArray(position));
    }
  }, [isNewStructure, poi, subCategory, position]);

  // Check if POI is found when component mounts or POI changes
  useEffect(() => {
    if (userId && currentItem?.id) {
      const found = isLocationFound(currentItem.id);
      setIsFound(found);
    }
  }, [userId, currentItem?.id, isLocationFound]);

  // Don't render marker if position is invalid
  if (!position || !Array.isArray(position) || position.length !== 2 || 
      position[0] == null || position[1] == null || 
      isNaN(position[0]) || isNaN(position[1])) {
    console.warn('MapMarker - Invalid position:', position, 'for POI:', currentItem);
    return null;
  }

  const handleShare = async () => {
    // For new POI structure, pass the current POI with subcategory name
    const itemForSharing = isNewStructure ? {
      ...currentItem,
      subcategory_name: subCategory?.name
    } : currentItem;
    
    console.log('Sharing item:', itemForSharing);
    
    const shareableLink = generateShareableLink(itemForSharing);
    try {
      await navigator.clipboard.writeText(shareableLink);
      success("Shareable link copied to clipboard!");
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      success("Shareable link copied to clipboard!");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Restaurant": "error",
      "Cafe": "warning",
      "Fast Food": "warning",
      "Tourist Attraction": "primary",
      "Museum": "secondary",
      "Hotel": "secondary",
      "Shopping": "success",
      "Transportation": "info",
      "Gas Station": "success",
      "Healthcare": "error",
      "Education": "info",
      "Entertainment": "warning",
      "Recreation": "info",
      "Bank": "success",
      "Religious": "secondary",
      "Other": "default"
    };
    return colors[category] || "default";
  };

  const handleFoundToggle = async (event) => {
    event.stopPropagation();
    
    if (!userId) {
      warning('Please log in to mark locations as found');
      return;
    }
    
    setFoundLoading(true);
    
    try {
      if (isFound) {
        const result = await removeFromFoundLocations(currentItem.id);
        if (result.success) {
          setIsFound(false);
        } else {
          console.error('Failed to remove found location:', result.error);
        }
      } else {
        const result = await addToFoundLocations(currentItem.id);
        if (result.success) {
          setIsFound(true);
        } else {
          console.error('Failed to add found location:', result.error);
        }
      }
    } catch (error) {
      console.error('Error toggling found status:', error);
    } finally {
      setFoundLoading(false);
    }
  };

  return (
    <Marker 
      key={currentItem.id} 
      position={position}
      icon={isNewStructure ? 
        createCategoryIcon(
          subCategory?.name, 
          iconImageUrl, 
          iconImageUrl ? 'custom_subcategory' : null, 
          subCategory?.color,
          poiIconSize
        ) :
        createCategoryIcon(marker.category, marker.customIcon, marker.selectedIcon, marker.iconColor, poiIconSize)
      }
    >
      <Tooltip>{displayName}</Tooltip>
      <Popup className="custom-popup">
        <Box sx={{ minWidth: 250, p: 1 }}>
          {/* POI Image - Only show for new structure if image exists */}
          {poiImageUrl && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img 
                src={poiImageUrl} 
                alt={displayName}
                style={{ 
                  width: '100%', 
                  maxHeight: '150px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {displayName}
            </Typography>
            <Chip 
              label={displayCategory} 
              color={getCategoryColor(displayCategory)}
              size="small"
            />
          </Box>
          
          {displayDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {displayDescription}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            {/* Location info if needed */}
            {currentItem.createdAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Added:</strong> {new Date(currentItem.createdAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          {/* Found Location Checkbox - Only show for logged-in users and non-admin view */}
          {userId && !canEdit && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isFound}
                    onChange={handleFoundToggle}
                    disabled={foundLoading}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {foundLoading ? 'Updating...' : (isFound ? 'Found' : 'Mark as Found')}
                  </Typography>
                }
              />
            </Box>
          )}

          <Stack spacing={1}>
            <Button
              onClick={handleShare}
              variant="contained"
              color="primary"
              fullWidth
              size="small"
              startIcon={<ShareIcon />}
            >
              Share Link
            </Button>
            
            { canEdit && (
              <Stack direction="row" spacing={1}>
                {onEdit && (
                  <Button
                    onClick={() => onEdit(currentItem)}
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                )}
                {onRemove && (
                  <Button
                    onClick={() => onRemove(currentItem.id)}
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    sx={{ flex: 1 }}
                  >
                    Delete
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
