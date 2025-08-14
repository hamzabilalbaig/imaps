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
  useMediaQuery,
  CircularProgress,
  Avatar
} from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon, CloudUpload as UploadIcon } from "@mui/icons-material";
import useUserStore from "../stores/user";
import useSubCategoriesStore from "../stores/subCategories";
import uploadFile from "../aws/fileUpload";

/**
 * Form component for adding or editing POIs
 */
function POIForm({ poi, onSave, onCancel, isEdit = false, isAdmin = false }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { initializeUser, id } = useUserStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  // POI creation and update handled by parent via onSave callback

  useEffect(() => {
    initializeUser();
    initializeSubCategories();
  }, []); // Only run once on mount

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sub_category_id: "",
    image_url: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Get all subcategories (no category filtering needed)
  const availableSubCategories = subCategories;

  useEffect(() => {
    if (poi && isEdit) {
      setFormData({
        name: poi.name || "",
        description: poi.description || "",
        sub_category_id: poi.sub_category_id || "",
        image_url: poi.image_url || "",
      });
      if (poi.image_url) {
        setImagePreview(poi.image_url);
      }
    }
  }, [poi, isEdit]);

  // No need to reset subcategory since category is removed

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to S3
      const uploadedUrl = await uploadFile(file, setUploadingImage);
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
      } else {
        alert('Failed to upload image. Please try again.');
        setSelectedImage(null);
        setImagePreview('');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setSelectedImage(null);
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.name.trim()) {
      alert("Please enter a name for the POI");
      setLoading(false);
      return;
    }
    
    if (!formData.sub_category_id) {
      alert("Please select a subcategory for the POI");
      setLoading(false);
      return;
    }

    try {
      const submissionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sub_category_id: parseInt(formData.sub_category_id),
        image_url: formData.image_url || "", // Always send empty string, never null
        coords: poi?.coords ? (typeof poi.coords === 'string' ? 
          poi.coords.split(',').map(coord => parseFloat(coord.trim())) : 
          poi.coords
        ) : null,
        is_approved: isAdmin // Admin auto-approval
      };

      // Pass data to parent for API call
      onSave(submissionData);
    } catch (error) {
      console.error('Error submitting POI:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        pb: { xs: 1, md: 2 },
        fontSize: { xs: '1.25rem', md: '1.5rem' },
        fontWeight: 600
      }}>
        {isEdit ? 'Edit POI' : (isAdmin ? 'Add New POI' : 'Suggest New POI')}
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pt: 1 }}>
              {/* Info message for non-admin users */}
          {!isAdmin && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                You are suggesting a new POI. An admin will review your submission before it appears on the map.
              </Typography>
            </Alert>
          )}
          <TextField
            name="name"
            label="POI Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Enter a descriptive name for this POI"
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
            placeholder="Add any additional details about this POI"
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
            <InputLabel>SubCategory</InputLabel>
            <Select
              name="sub_category_id"
              value={formData.sub_category_id}
              label="SubCategory"
              onChange={handleChange}
              required
              sx={{
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              {availableSubCategories.map((subCategory) => (
                <MenuItem key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Image Upload Section - Only show for admins */}
          {isAdmin && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                POI Image
              </Typography>
              
              {imagePreview && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <Avatar
                    src={imagePreview}
                    alt="POI Image"
                    variant="rounded"
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '2px solid',
                      borderColor: 'grey.300'
                    }}
                  />
                </Box>
              )}

              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                disabled={uploadingImage}
                sx={{
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  py: 2,
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPEG, PNG, GIF. Max size: 5MB
              </Typography>
            </Box>
          )}

      
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        pt: { xs: 1, md: 2 },
        gap: { xs: 1, md: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={onCancel}
          startIcon={<CancelIcon />}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            minWidth: { sm: 120 },
            borderRadius: 2,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          disabled={loading || uploadingImage}
          fullWidth={isMobile}
          sx={{
            minWidth: { sm: 120 },
            borderRadius: 2,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {loading ? 'Saving...' : isEdit ? 'Update POI' : (isAdmin ? 'Create POI' : 'Suggest POI')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default POIForm;
