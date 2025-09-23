import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiUtils';
import { getMyPOISubcategories } from '../api/functions/apiFunctions';
import uploadFile from '../aws/fileUpload';
import useUserStore from '../stores/user';
import usePOIsStore from '../stores/pois';
import { useAlerts } from '../hooks/useAlerts';

const EditMyPOIForm = ({ open, onClose, onSuccess, poi, myCategories = [] }) => {
  const { user } = useAuth();
  const { updatePOI } = usePOIsStore();
  const { error, warning } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // POI form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coords: '',
    sub_category_id: '',
    image_url: ''
  });

  useEffect(() => {
    if (open && user?.id) {
      fetchMySubcategories();
    }
  }, [open, user?.id]);

  // Initialize form data when POI is provided
  useEffect(() => {
    if (poi && open) {
      const coords = Array.isArray(poi.coords) 
        ? `${poi.coords[0]}, ${poi.coords[1]}` 
        : poi.coords || '';
      
      setFormData({
        name: poi.name || '',
        description: poi.description || '',
        coords: coords,
        sub_category_id: poi.sub_category_id || '',
        image_url: poi.image_url || ''
      });
      
      if (poi.image_url) {
        setImagePreview(poi.image_url);
      }
    }
  }, [poi, open]);

  const fetchMySubcategories = async () => {
    try {
      const subcategoriesData = await getMyPOISubcategories(user.id);
      setSubcategories(subcategoriesData || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      error('Failed to load subcategories');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    try {
      setUploadingImage(true);
      setSelectedFile(file);
      
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
        setSelectedFile(null);
        setImagePreview('');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      error('Failed to upload image. Please try again.');
      setSelectedFile(null);
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      warning('Please enter a name for your POI');
      return;
    }
    
    if (!formData.sub_category_id) {
      warning('Please select a category for your POI');
      return;
    }

    try {
      setLoading(true);
      
      // Handle coordinates - convert string to array if needed
      let coords = formData.coords;
      if (typeof coords === 'string' && coords.trim()) {
        coords = coords.split(',').map(coord => parseFloat(coord.trim()));
      } else if (Array.isArray(poi.coords)) {
        coords = poi.coords;
      } else if (poi.position && Array.isArray(poi.position)) {
        coords = poi.position;
      } else {
        // Fallback - keep original coords from POI
        coords = poi.coords;
      }

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sub_category_id: parseInt(formData.sub_category_id),
        image_url: formData.image_url || '',
        coords: coords,
        // Preserve the original approval status when editing
        is_approved: poi.is_approved
      };

      console.log('EditMyPOIForm - Updating POI:', { 
        poiId: poi.id, 
        updateData,
        originalCoords: poi.coords,
        originalPosition: poi.position,
        formDataCoords: formData.coords,
        finalCoords: coords
      });
      
      const result = await updatePOI(poi.id, updateData);
      
      console.log('EditMyPOIForm - Update result:', result);
      
      if (result.success) {
        console.log('EditMyPOIForm - Update successful:', result.poi);
        onSuccess(result.poi);
        handleClose();
      } else {
        error(result.error || 'Failed to update POI');
      }
    } catch (err) {
      console.error('Error updating POI:', err);
      error('Failed to update POI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      coords: '',
      sub_category_id: '',
      image_url: ''
    });
    setImagePreview('');
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
          })
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: { xs: 1, md: 2 },
        fontSize: { xs: '1.25rem', md: '1.5rem' },
        fontWeight: 600
      }}>
        Edit My POI
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pt: 1 }}>

          <TextField
            name="name"
            label="POI Name"
            value={formData.name}
            onChange={handleInputChange}
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
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Add a detailed description of this POI"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />

          <FormControl 
            fullWidth 
            required 
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          >
            <InputLabel>Category</InputLabel>
            <Select
              name="sub_category_id"
              value={formData.sub_category_id}
              onChange={handleInputChange}
              label="Category"
            >
              {subcategories.map((subcategory) => (
                <MenuItem key={subcategory.id} value={subcategory.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {subcategory.icon_image_url && (
                      <Avatar
                        src={subcategory.icon_image_url}
                        sx={{ width: 24, height: 24 }}
                      />
                    )}
                    <Typography>{subcategory.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Image Upload Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              POI Image (Optional)
            </Typography>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="poi-image-upload"
              disabled={uploadingImage}
            />
            
            <label htmlFor="poi-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={uploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={uploadingImage}
                fullWidth
                sx={{
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </Button>
            </label>

            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="POI Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            )}
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 },
        gap: { xs: 1, md: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          variant="outlined"
          disabled={loading}
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
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMyPOIForm;