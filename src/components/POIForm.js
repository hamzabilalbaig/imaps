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
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { localDB } from "../utils/localStorage";

/**
 * Form component for adding or editing POIs
 */
function POIForm({ poi, onSave, onCancel, isEdit = false, isAdmin = false }) {
  const { getCategoryNames, getCategoryByName } = useCategories();
  const { canAddPOItoCategory, getRemainingPOIsForCategory } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [categoryLimitWarning, setCategoryLimitWarning] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    if (poi && isEdit) {
      setFormData({
        title: poi.title || "",
        description: poi.description || "",
        category: poi.category || "",
      });
    }
  }, [poi, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a title for the POI");
      return;
    }
    
    if (!formData.category) {
      alert("Please select a category for the POI");
      return;
    }
    
    // Get category data to include icon and color information
    const categoryData = getCategoryByName(formData.category);
    
    // Check category limits before saving (for new POIs)
    if (!isEdit && categoryData) {
      const poisInCategory = localDB.getPOICountInCategory(categoryData.id);
      if (!canAddPOItoCategory(categoryData.id, poisInCategory)) {
        alert("This category has reached its POI limit. Please upgrade your plan or choose a different category.");
        return;
      }
    }
    
    const submissionData = {
      ...formData,
      categoryId: categoryData?.id || null,
      selectedIcon: categoryData?.selectedIcon || null,
      customIcon: categoryData?.customIcon || null,
      iconColor: categoryData?.color || "#6b7280"
    };
    
    console.log('POIForm submitting data:', submissionData);
    console.log('POIForm submitting data:', submissionData);
    onSave(submissionData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check category limits when category is selected
    if (name === 'category' && value) {
      const categoryData = getCategoryByName(value);
      if (categoryData) {
        const poisInCategory = localDB.getPOICountInCategory(categoryData.id);
        const canAdd = canAddPOItoCategory(categoryData.id, poisInCategory);
        const remaining = getRemainingPOIsForCategory(poisInCategory);
        
        if (!canAdd) {
          setCategoryLimitWarning(`This category has reached its POI limit. Upgrade your plan or choose a different category.`);
        } else if (remaining !== Infinity && remaining <= 2) {
          setCategoryLimitWarning(`Only ${remaining} POI${remaining !== 1 ? 's' : ''} remaining in this category.`);
        } else {
          setCategoryLimitWarning("");
        }
      }
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
            {isEdit ? "Edit Location" : (isAdmin ? "Add New Location" : "Suggest New Location")}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pt: 1 }}>
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
              {getCategoryNames()?.length === 0 ? (
                <MenuItem disabled>
                  No categories available. Create categories first.
                </MenuItem>
              ) : (
                getCategoryNames()?.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {categoryLimitWarning && (
            <Alert 
              severity={categoryLimitWarning.includes('reached') ? 'error' : 'warning'} 
              sx={{ 
                borderRadius: 2,
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              {categoryLimitWarning}
            </Alert>
          )}

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
          {isEdit ? "Update Location" : (isAdmin ? "Add Location" : "Suggest Location")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default POIForm;
