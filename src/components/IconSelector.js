import React, { useState, useRef } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon
} from "@mui/icons-material";
import { CATEGORY_ICONS, getCustomIcons } from "../utils/mapUtils";
import { localDB } from '../utils/localStorage';
import { useAuth } from '../contexts/AuthContext';

/**
 * Icon selector component for POI forms
 */
function IconSelector({ selectedIcon, onIconSelect, customIcons = [] }) {
  const { canUseCustomIcons } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef(null);

  // Get all available icons (built-in + custom)
  const builtInIcons = Object.keys(CATEGORY_ICONS);

  const handleIconClick = (iconKey) => {
    // Check if it's a custom icon
    const customIcon = customIcons.find(icon => icon.id === iconKey);
    onIconSelect(iconKey, customIcon);
    setIsOpen(false);
    setShowUpload(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PNG, SVG, JPG, or JPEG file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const customIcon = {
        id: `custom_${Date.now()}`,
        name: file.name.split('.')[0],
        data: e.target.result,
        type: file.type
      };
      
      // Save to localStorage for persistence using the database
      const result = localDB.addCustomIcon(customIcon);
      if (result.success) {
        onIconSelect(result.icon.id, result.icon);
      } else {
        alert('Error saving custom icon: ' + result.message);
      }
      setIsOpen(false);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const renderIcon = (iconKey, size = 24) => {
    // Check if it's a custom icon
    const customIcon = customIcons.find(icon => icon.id === iconKey);
    if (customIcon) {
      return (
        <img 
          src={customIcon.data} 
          alt={customIcon.name}
          style={{ width: size, height: size }}
        />
      );
    }

    // Built-in icon
    const IconComponent = CATEGORY_ICONS[iconKey];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }

    // Fallback
    return <Box sx={{ width: size, height: size, backgroundColor: 'grey.300', borderRadius: 1 }} />;
  };

  const getSelectedIconDisplay = () => {
    if (!selectedIcon) return "Select Icon";
    
    const customIcon = customIcons.find(icon => icon.id === selectedIcon);
    if (customIcon) {
      return customIcon.name || "Custom Icon";
    }
    
    return selectedIcon;
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        Icon
      </Typography>
      
      {/* Icon selector button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outlined"
        fullWidth
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          py: 1.5,
          color: 'text.primary',
          borderColor: 'grey.300'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedIcon && (
            <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderIcon(selectedIcon, 20)}
            </Box>
          )}
          <Typography variant="body2">
            {getSelectedIconDisplay()}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {isOpen ? "▲" : "▼"}
        </Typography>
      </Button>

      {/* Icon grid dialog */}
      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Select Icon</Typography>
          <IconButton onClick={() => setIsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              disabled={!canUseCustomIcons()}
              variant="outlined"
              startIcon={<AddIcon />}
              fullWidth
              sx={{ 
                mb: 2,
                '&:disabled': {
                  backgroundColor: 'grey.100',
                  color: 'grey.400'
                }
              }}
            >
              {canUseCustomIcons() ? 'Add Custom Icon' : 'Custom Icons (Upgrade Required)'}
            </Button>

            {showUpload && canUseCustomIcons() && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload custom icon (PNG, SVG, JPG, JPEG - max 2MB)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                  >
                    Choose File
                  </Button>
                  <IconButton 
                    onClick={() => setShowUpload(false)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Paper>
            )}

            {!canUseCustomIcons() && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Custom icon upload is available with the Unlimited plan. Upgrade to unlock this feature.
              </Alert>
            )}
          </Box>

          <Grid container spacing={1}>
            {/* Built-in icons */}
            {builtInIcons.map((iconKey) => (
              <Grid item xs={2} key={iconKey}>
                <Button
                  onClick={() => handleIconClick(iconKey)}
                  variant={selectedIcon === iconKey ? "contained" : "outlined"}
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    minWidth: 0,
                    p: 1
                  }}
                >
                  {renderIcon(iconKey, 20)}
                </Button>
              </Grid>
            ))}

            {/* Custom icons */}
            {customIcons.map((customIcon) => (
              <Grid item xs={2} key={customIcon.id}>
                <Button
                  onClick={() => handleIconClick(customIcon.id)}
                  variant={selectedIcon === customIcon.id ? "contained" : "outlined"}
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    minWidth: 0,
                    p: 1
                  }}
                >
                  {renderIcon(customIcon.id, 20)}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IconSelector;
