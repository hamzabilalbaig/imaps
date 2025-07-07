import React from "react";
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
 * @param {Object} marker - Marker data object
 * @param {Function} onRemove - Callback function to remove the marker
 * @param {Function} onEdit - Callback function to edit the marker
 * @param {boolean} isAdmin - Whether this is admin view with edit capabilities
 */
function MapMarker({ marker, onRemove, onEdit, isAdmin = false }) {
  const theme = useTheme();
  
  const handleShare = async () => {
    const shareableLink = generateShareableLink(marker);
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

  return (
    <Marker 
      key={marker.id} 
      position={marker.position}
      icon={createCategoryIcon(marker.category, marker.customIcon, marker.selectedIcon)}
    >
      <Popup className="custom-popup">
        <Box sx={{ minWidth: 250, p: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {marker.title || "Untitled POI"}
            </Typography>
            <Chip 
              label={marker.category} 
              color={getCategoryColor(marker.category)}
              size="small"
            />
          </Box>
          
          {marker.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {marker.description}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Location:</strong> {marker.coords}
            </Typography>
            {marker.createdAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Added:</strong> {new Date(marker.createdAt).toLocaleDateString()}
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
            
            {isAdmin && (
              <Stack direction="row" spacing={1}>
                {onEdit && (
                  <Button
                    onClick={() => onEdit(marker)}
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
                    onClick={() => onRemove(marker.id)}
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
