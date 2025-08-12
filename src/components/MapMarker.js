import React, { useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
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

/**
 * Individual marker component with popup
 * @param {Object} poi - POI data object with new structure
 * @param {Object} marker - Legacy marker data object (for backward compatibility)
 * @param {Array} subCategories - Array of subcategories with icons
 * @param {Function} onRemove - Callback function to remove the POI/marker
 * @param {Function} onEdit - Callback function to edit the POI/marker
 * @param {boolean} isAdmin - Whether this is admin view with edit capabilities
 * @param {boolean} canEdit - Whether the current user can edit this POI/marker
 */
function MapMarker({ poi, marker, subCategories = [], onRemove, onEdit, isAdmin = false, canEdit = false }) {
  const theme = useTheme();
  
  // Support both new POI structure and legacy marker structure
  const currentItem = poi || marker;
  const isNewStructure = !!poi;
  
  // Get subcategory data for new structure
  const subCategory = isNewStructure ? 
    subCategories.find(sub => sub.id === poi.sub_category_id) : null;

  // Debug logging for new structure
  useEffect(() => {
    if (isNewStructure) {
      console.log('MapMarker - POI:', poi);
      console.log('MapMarker - SubCategory:', subCategory);
      console.log('MapMarker - Position:', poi.position || poi.coords);
    }
  }, [poi, subCategory, isNewStructure]);
  
  const handleShare = async () => {
    const shareableLink = generateShareableLink(currentItem);
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

  // Get display values based on structure
  const displayName = isNewStructure ? poi.name : (marker.title || "Untitled POI");
  const displayDescription = isNewStructure ? poi.description : marker.description;
  const displayCategory = isNewStructure ? subCategory?.name : marker.category;
  const position = isNewStructure ? poi.position || poi.coords : marker.position;
  const iconImageUrl = isNewStructure ? subCategory?.icon_image_url : null;
  const poiImageUrl = isNewStructure ? poi.image_url : null;

  // Debug position format
  useEffect(() => {
    if (isNewStructure) {
      console.log('MapMarker - Position format:', position, typeof position, Array.isArray(position));
    }
  }, [position, isNewStructure]);

  return (
    <Marker 
      key={currentItem.id} 
      position={position}
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
