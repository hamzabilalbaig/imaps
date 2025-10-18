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
import useCategoriesStore from "../stores/categories";
import uploadFile from "../aws/fileUpload";
import { useAlerts } from "../hooks/useAlerts";

/**
 * Form component for adding or editing POIs
 */
const extractCoords = (source) => {
  if (!source) {
    return null;
  }

  const candidate = source.position ?? source.coords ?? source.location;

  const toNumberPair = (value) => {
    if (!Array.isArray(value) || value.length < 2) {
      return null;
    }

    const numbers = value.slice(0, 2).map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return item;
      }

      if (typeof item === 'string') {
        const parsed = Number(item.trim());
        return Number.isFinite(parsed) ? parsed : null;
      }

      return null;
    });

    if (numbers.every((item) => item !== null)) {
      return numbers;
    }

    return null;
  };

  if (Array.isArray(candidate)) {
    return toNumberPair(candidate);
  }

  if (typeof candidate === 'string') {
    const matches = candidate.match(/-?\d+(?:\.\d+)?/g);
    if (matches && matches.length >= 2) {
      return toNumberPair(matches.slice(0, 2));
    }
    return null;
  }

  if (candidate && typeof candidate === 'object') {
    const { lat, lng, latitude, longitude } = candidate;
    if (lat != null && lng != null) {
      return toNumberPair([lat, lng]);
    }
    if (latitude != null && longitude != null) {
      return toNumberPair([latitude, longitude]);
    }
  }

  return null;
};

function POIForm({ poi, onSave, onCancel, isEdit = false, isAdmin = false }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { initializeUser, id } = useUserStore();
  const { subCategories, initializeSubCategories } = useSubCategoriesStore();
  const { categories, initializeCategories } = useCategoriesStore();
  const { warning, error } = useAlerts();
  // POI creation and update handled by parent via onSave callback

  const isPoiApproved = (value) => {
    return value === true || value === 1 || value === 'true';
  };

  const isPendingApproval = Boolean(isEdit && poi && !isPoiApproved(poi?.is_approved));

  useEffect(() => {
    initializeUser();
    initializeSubCategories();
    initializeCategories();
  }, []); // Only run once on mount

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    image_url: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Filter subcategories based on selected category
  const availableSubCategories = formData.category_id 
    ? subCategories.filter(sub => sub.category_id === parseInt(formData.category_id))
    : [];

  useEffect(() => {
    if (poi && isEdit) {
      // Find the category of the POI's subcategory
      const poiSubCategory = subCategories.find(sub => sub.id === poi.sub_category_id);
      const categoryId = poiSubCategory ? poiSubCategory.category_id : "";
      
      setFormData({
        name: poi.name || "",
        description: poi.description || "",
        category_id: categoryId,
        sub_category_id: poi.sub_category_id || "",
        image_url: poi.image_url || "",
      });
      if (poi.image_url) {
        setImagePreview(poi.image_url);
      }
    }
  }, [poi, isEdit, subCategories]);

  // Reset subcategory when category changes
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      sub_category_id: "" // Reset subcategory when category changes
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      warning('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    // if (file.size > 5 * 1024 * 1024) {
    //   warning('File size must be less than 5MB');
    //   return;
    // }

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
        error('Failed to upload image. Please try again.');
        setSelectedImage(null);
        setImagePreview('');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      error('Failed to upload image. Please try again.');
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
      warning("Please enter a name for the POI");
      setLoading(false);
      return;
    }
    
    if (!formData.category_id) {
      warning("Please select a category for the POI");
      setLoading(false);
      return;
    }
    
    if (!formData.sub_category_id) {
      warning("Please select a subcategory for the POI");
      setLoading(false);
      return;
    }

    try {
      const baseSubmission = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sub_category_id: parseInt(formData.sub_category_id),
        image_url: formData.image_url || "", // Always send empty string, never null
        is_approved: isAdmin // Admin auto-approval
      };

      const resolvedCoords = extractCoords(poi);
      const submissionData = { ...baseSubmission };

      if (resolvedCoords) {
        submissionData.coords = resolvedCoords;
        submissionData.position = resolvedCoords;
      }

      // Pass data to parent for API call
      onSave(submissionData);
    } catch (err) {
      console.error('Error submitting POI:', err);
      error('An unexpected error occurred. Please try again.');
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
            <InputLabel>Category</InputLabel>
            <Select
              name="category_id"
              value={formData.category_id}
              label="Category"
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
              sx={{
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel>SubCategory</InputLabel>
            <Select
              name="sub_category_id"
              value={formData.sub_category_id}
              label="SubCategory"
              onChange={handleChange}
              required
              disabled={!formData.category_id}
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
            {!formData.category_id && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                Please select a category first
              </Typography>
            )}
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
          {loading
            ? 'Saving...'
            : isEdit
              ? (isPendingApproval
                  ? (isAdmin ? 'Approve POI' : 'Submit for Approval')
                  : 'Update POI')
              : (isAdmin ? 'Create POI' : 'Suggest POI')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default POIForm;
