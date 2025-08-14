import React, { useEffect, useState } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Stack,
  useTheme
} from "@mui/material";
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { generateShareableLink, createCategoryIcon } from "../utils/mapUtils";
import useUserStore from "../stores/user";

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
  const isAdmin = useUserStore(state => state.isadmin)
  const canEdit = isAdmin ? true : false
  useEffect(() => {
    console.log("MapMarker - isAdmin:", isAdmin);
  }, [isAdmin]);
  const theme = useTheme();
  const [popupRef, setPopupRef] = useState(null);
  
  // Support both new POI structure and legacy marker structure
  const currentItem = poi || marker;
  const isNewStructure = !!poi;
  
  // Get subcategory data for new structure
  const subCategory = isNewStructure ? 
    subCategories.find(sub => sub.id === poi.sub_category_id) : null;

  // Get display values based on structure
  const displayName = isNewStructure ? poi.name : (marker?.title || "Untitled POI");
  const displayDescription = isNewStructure ? poi.description : marker?.description;
  const displayCategory = isNewStructure ? subCategory?.name : marker?.category;
  const position = isNewStructure ? poi.position || poi.coords : marker?.position;
  const iconImageUrl = isNewStructure ? subCategory?.icon_image_url : null;
  const poiImageUrl = isNewStructure ? poi.image_url : null;

  // Debug logging for new structure
  useEffect(() => {
    if (isNewStructure) {
      console.log('MapMarker - POI:', poi);
      console.log('MapMarker - SubCategory:', subCategory);
      console.log('MapMarker - Position:', poi.position || poi.coords);
      console.log('MapMarker - Is Focused:', isFocused);
    }
  }, [poi, subCategory, isNewStructure, isFocused]);

  // Auto-open popup when focused
  useEffect(() => {
    if (isFocused) {
      console.log('POI is focused - attempting to open popup:', currentItem);
      
      // Get position safely based on structure
      const markerPosition = isNewStructure ? 
        (poi.position || poi.coords) : 
        (marker?.position || [0, 0]);
      
      // Try multiple approaches with increasing delays
      const delays = [500, 1000, 2000, 3000];
      
      delays.forEach((delay) => {
        setTimeout(() => {
          try {
            // Approach 1: Use popup ref
            if (popupRef && typeof popupRef.openPopup === 'function') {
              console.log(`Approach 1: Attempting to open popup via ref after ${delay}ms`);
              popupRef.openPopup();
            }
            
            // Approach 2: Use global map instance and coordinates
            if (window.leafletMap && markerPosition) {
              console.log(`Approach 2: Attempting to open popup via map.openPopup() after ${delay}ms`);
              
              // Create a temporary popup if needed
              const tempPopup = L.popup()
                .setLatLng(markerPosition)
                .setContent(`<div id="temp-popup-${currentItem.id}">Loading...</div>`)
                .openOn(window.leafletMap);
              
              // Click the marker programmatically
              window.leafletMap.fire('click', {
                latlng: L.latLng(markerPosition[0], markerPosition[1]),
                layerPoint: window.leafletMap.latLngToLayerPoint(L.latLng(markerPosition[0], markerPosition[1])),
                containerPoint: window.leafletMap.latLngToContainerPoint(L.latLng(markerPosition[0], markerPosition[1]))
              });
            }
          } catch (error) {
            console.error('Error opening popup:', error);
          }
        }, delay);
      });
    }
  }, [isFocused, popupRef, currentItem, isNewStructure, poi, marker]);
  
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
      alert("Shareable link copied to clipboard!");
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Shareable link copied to clipboard!");
    }
  };

  useEffect(() => {
    console.log("POI/Marker updated:", currentItem);
  }, [currentItem]);

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

  return (
    <Marker 
      key={currentItem.id} 
      position={position}
      ref={setPopupRef}
      icon={isNewStructure ? 
        createCategoryIcon(
          subCategory?.name, 
          iconImageUrl, 
          iconImageUrl ? 'custom_subcategory' : null, 
          subCategory?.color
        ) :
        createCategoryIcon(marker.category, marker.customIcon, marker.selectedIcon, marker.iconColor)
      }
    >
      <Tooltip>{displayName}</Tooltip>
      <Popup className="custom-popup" ref={popupRef}>
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
