import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { POI_CATEGORIES, getCustomIcons } from "../utils/mapUtils";
import IconSelector from "./IconSelector";

/**
 * Form component for adding or editing POIs
 */
function POIForm({ poi, onSave, onCancel, isEdit = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    customIcon: null,
    selectedIcon: null,
  });
  const [customIcons, setCustomIcons] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    // Load custom icons from localStorage
    const savedCustomIcons = getCustomIcons();
    setCustomIcons(savedCustomIcons);

    if (poi && isEdit) {
      setFormData({
        title: poi.title || "",
        description: poi.description || "",
        category: poi.category || "Other",
        customIcon: poi.customIcon || null,
        selectedIcon: poi.selectedIcon || null,
      });
    }
  }, [poi, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a title for the POI");
      return;
    }
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconSelect = (iconKey, customIconData = null) => {
    setFormData((prev) => ({
      ...prev,
      selectedIcon: iconKey,
      customIcon: customIconData,
    }));

    // If it's a new custom icon, update the custom icons list
    if (customIconData) {
      setCustomIcons((prev) => {
        const exists = prev.find((icon) => icon.id === customIconData.id);
        if (!exists) {
          return [...prev, customIconData];
        }
        return prev;
      });
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: {
          ...(isMobile && {
            m: 0,
            maxHeight: '100vh',
            borderRadius: 0,
            maxWidth: '100vw'
          }),
          ...(isTablet && !isMobile && {
            m: 1,
            maxWidth: 'calc(100vw - 32px)'
          })
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: '1px solid',
        borderColor: 'grey.100',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        p: { xs: 2, md: 3 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: 2,
              p: { xs: 0.75, md: 1 },
              mr: { xs: 1.5, md: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SaveIcon sx={{ color: 'white', fontSize: { xs: 16, md: 20 } }} />
          </Box>
          <Typography variant="h5" component="h2" fontWeight={600} sx={{ fontSize: { xs: '1.125rem', md: '1.5rem' } }}>
            {isEdit ? "Edit Location" : "Add New Location"}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pt: 1 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ 
              mb: 2, 
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}>
              Choose Icon
            </Typography>
            <IconSelector
              selectedIcon={formData.selectedIcon}
              onIconSelect={handleIconSelect}
              customIcons={customIcons}
            />
          </Box>

          <TextField
            name="title"
            label="Location Name"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Enter a descriptive name for this location"
            helperText="Required field"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />

          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            placeholder="Add any additional details about this location"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />

          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Category"
              onChange={handleChange}
              sx={{
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              {POI_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {poi && (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'info.light',
                backgroundColor: 'info.50',
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                <strong>Location:</strong> {poi.coords}
              </Typography>
              {isEdit && (
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Created:</strong>{" "}
                  {new Date(poi.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'grey.100',
        backgroundColor: 'grey.50',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button 
          onClick={onCancel} 
          startIcon={<CancelIcon />}
          color="inherit"
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontSize: { xs: '0.875rem', md: '1rem' },
            borderColor: 'grey.300',
            '&:hover': {
              borderColor: 'grey.400',
              backgroundColor: 'grey.50'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          startIcon={<SaveIcon />}
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontSize: { xs: '0.875rem', md: '1rem' },
            ml: { xs: 0, sm: 1 },
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
            }
          }}
        >
          {isEdit ? "Update Location" : "Add Location"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default POIForm;
