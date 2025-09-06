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
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  LocationOn as LocationOnIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiUtils';
import uploadFile from '../aws/fileUpload';
import useUserStore from '../stores/user';
import { useAlerts } from '../hooks/useAlerts';

const MyPOIForm = ({ open, onClose, onSuccess, mapClickCoords = null, myPois = [], myCategories = [] }) => {
  const { user } = useAuth();
  const { plan, planLimits: userPlanLimits, getRemainingCategories } = useUserStore();
  const { error, warning } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Subcategory icon states
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [selectedIconFile, setSelectedIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  
  // POI form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coords: '',
    sub_category_id: '',
    image_url: ''
  });

  // Subcategory form data
  const [subcategoryData, setSubcategoryData] = useState({
    name: '',
    color: '#3b82f6',
    icon_image_url: ''
  });

  useEffect(() => {
    if (open && user?.id) {
      fetchMySubcategories();
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (mapClickCoords) {
      const coords = `${mapClickCoords.lat}, ${mapClickCoords.lng}`;
      setFormData(prev => ({ ...prev, coords }));
    }
  }, [mapClickCoords]);

  // Calculate current limits
  const currentUserPlan = plan || 'free';
  const planLimits = userPlanLimits?.[currentUserPlan];
  const currentMyPOIsCount = myPois?.length || 0;
  const currentSubcategoriesCount = myCategories?.length || 0;
  
  // Check if user can create more My POIs (based on total plan limit only)
  const canCreateMorePOIs = currentMyPOIsCount < (planLimits?.totalPOILimit || 0);
  const remainingPOIs = planLimits?.totalPOILimit === Infinity ? 
    Infinity : 
    Math.max(0, (planLimits?.totalPOILimit || 0) - currentMyPOIsCount);
  
  // Check if user can create more subcategories
  const canCreateMoreSubcategories = currentSubcategoriesCount < (planLimits?.maxCustomCategories || 0);
  const remainingSubcategories = planLimits?.maxCustomCategories === Infinity ? 
    Infinity : 
    Math.max(0, (planLimits?.maxCustomCategories || 0) - currentSubcategoriesCount);

  const fetchMySubcategories = async () => {
    try {
      const response = await apiCall(`/my-pois/subcategories/${user.id}`, 'GET');
      setSubcategories(response || []);
    } catch (error) {
      console.error('Error fetching my subcategories:', error);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Auto upload the selected file
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (fileToUpload = null) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadFile(file, () => {});
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
        setImagePreview(uploadedUrl);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      error('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleIconFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedIconFile(file);
      setIconPreview(URL.createObjectURL(file));
      // Auto upload the selected icon file
      await handleIconUpload(file);
    }
  };

  const handleIconUpload = async (fileToUpload = null) => {
    const file = fileToUpload || selectedIconFile;
    if (!file) return;

    setUploadingIcon(true);
    try {
      const uploadedUrl = await uploadFile(file, () => {});
      if (uploadedUrl) {
        setSubcategoryData(prev => ({ ...prev, icon_image_url: uploadedUrl }));
        setIconPreview(uploadedUrl);
      }
    } catch (err) {
      console.error('Error uploading icon:', err);
      error('Failed to upload icon');
    }
    setUploadingIcon(false);
  };

  const handleRemoveIcon = () => {
    setSelectedIconFile(null);
    setIconPreview('');
    setSubcategoryData(prev => ({ ...prev, icon_image_url: '' }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubcategoryInputChange = (field, value) => {
    setSubcategoryData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSubcategory = async () => {
    if (!subcategoryData.name.trim()) {
      warning('Please enter a subcategory name');
      return;
    }

    // Check subcategory limit
    if (!canCreateMoreSubcategories) {
      warning(`You have reached your subcategory limit (${planLimits?.maxCustomCategories || 0}). Please upgrade your plan to add more subcategories.`);
      return;
    }

    setLoading(true);
    try {
      console.log('Creating subcategory with data:', subcategoryData); // Debug log
      const response = await apiCall('/my-pois/subcategories', 'POST', {
        ...subcategoryData,
        userId: user.id
      });

      if (response) {
        console.log('Subcategory created successfully:', response); // Debug log
        setSubcategories(prev => [...prev, response]);
        setFormData(prev => ({ ...prev, sub_category_id: response.id }));
        setSubcategoryData({ name: '', color: '#3b82f6', icon_image_url: '' });
        setShowSubcategoryForm(false);
        // Reset icon-related states
        setSelectedIconFile(null);
        setIconPreview('');
      }
    } catch (err) {
      console.error('Error creating subcategory:', err);
      error('Failed to create subcategory');
    }
    setLoading(false);
  };

  const handleCancelSubcategory = () => {
    setSubcategoryData({ name: '', color: '#3b82f6', icon_image_url: '' });
    setShowSubcategoryForm(false);
    setSelectedIconFile(null);
    setIconPreview('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.sub_category_id || !formData.coords) {
      warning('Please fill in all required fields and select a location on the map');
      return;
    }

    // Check POI limit
    if (!canCreateMorePOIs) {
      warning(`You have reached your My POI limit (${planLimits?.totalPOILimit || 0}). Please upgrade your plan to add more POIs.`);
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('/my-pois/pois', 'POST', {
        ...formData,
        userId: user.id
      });

      if (response) {
        onSuccess && onSuccess(response);
        handleClose();
      }
    } catch (err) {
      console.error('Error creating POI:', err);
      error('Failed to create POI');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      coords: '',
      sub_category_id: '',
      image_url: ''
    });
    setSubcategoryData({ name: '', color: '#3b82f6', icon_image_url: '' });
    setShowSubcategoryForm(false);
    setSelectedFile(null);
    setImagePreview('');
    setSelectedIconFile(null);
    setIconPreview('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Create My POI
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* POI Name */}
          <TextField
            label="POI Name *"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            fullWidth
            size="small"
          />

          {/* POI Description */}
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />

          {/* Coordinates Display */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Location *
            </Typography>
            
            {formData.coords ? (
              <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon color="success" />
                  <Typography variant="body2">
                    {formData.coords}
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Alert severity="error">
                No location selected. Please close this form and click the + button again to select a location.
              </Alert>
            )}
          </Box>

          {/* Usage Status */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Usage Status
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* POI Limit Status */}
              <Alert 
                severity={canCreateMorePOIs ? 'info' : 'warning'}
                sx={{ py: 0.5 }}
              >
                <Typography variant="body2">
                  My POIs: {currentMyPOIsCount}/{planLimits?.totalPOILimit === Infinity ? '∞' : planLimits?.totalPOILimit || 0}
                  {!canCreateMorePOIs && ' (Limit reached)'}
                </Typography>
              </Alert>
              
              {/* Subcategory Limit Status */}
              <Alert 
                severity={canCreateMoreSubcategories ? 'info' : 'warning'}
                sx={{ py: 0.5 }}
              >
                <Typography variant="body2">
                  Subcategories: {currentSubcategoriesCount}/{planLimits?.maxCustomCategories === Infinity ? '∞' : planLimits?.maxCustomCategories || 0}
                  {!canCreateMoreSubcategories && ' (Limit reached)'}
                </Typography>
              </Alert>
            </Box>
          </Box>

          {/* Image Upload Only */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              POI Image
            </Typography>
            
            {/* Image Preview */}
            {(imagePreview || formData.image_url) && (
              <Paper sx={{ p: 2, mb: 2, position: 'relative' }}>
                <img
                  src={imagePreview || formData.image_url}
                  alt="POI Preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            )}

            {/* File Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                disabled={uploadingImage}
                sx={{ justifyContent: 'flex-start' }}
                fullWidth
              >
                {uploadingImage ? 'Uploading...' : (selectedFile ? selectedFile.name : 'Choose Image File')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Button>
            </Box>
          </Box>

          {/* Subcategory Selection */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subcategory *</InputLabel>
                <Select
                  value={formData.sub_category_id}
                  label="Subcategory *"
                  onChange={(e) => handleInputChange('sub_category_id', e.target.value)}
                >
                  {subcategories.map((subcat) => (
                    <MenuItem key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Tooltip title={canCreateMoreSubcategories ? "Create new subcategory" : `Subcategory limit reached (${currentSubcategoriesCount}/${planLimits?.maxCustomCategories || 0})`}>
                <IconButton
                  onClick={() => setShowSubcategoryForm(true)}
                  size="small"
                  disabled={!canCreateMoreSubcategories}
                  sx={{ 
                    bgcolor: canCreateMoreSubcategories ? 'primary.main' : 'grey.400', 
                    color: 'white',
                    '&:hover': { 
                      bgcolor: canCreateMoreSubcategories ? 'primary.dark' : 'grey.400' 
                    },
                    '&:disabled': {
                      bgcolor: 'grey.400',
                      color: 'grey.600'
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Create Subcategory Form */}
            {showSubcategoryForm && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                bgcolor: 'grey.50'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Create New Subcategory
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    label="Subcategory Name"
                    value={subcategoryData.name}
                    onChange={(e) => handleSubcategoryInputChange('name', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  
                  <TextField
                    label="Color"
                    type="color"
                    value={subcategoryData.color}
                    onChange={(e) => handleSubcategoryInputChange('color', e.target.value)}
                    size="small"
                    sx={{ width: 100 }}
                  />
                  
                  {/* Icon Upload */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Icon Image
                    </Typography>
                    
                    {/* Icon Preview */}
                    {(iconPreview || subcategoryData.icon_image_url) && (
                      <Paper sx={{ p: 1, mb: 1, position: 'relative', display: 'inline-block' }}>
                        <img
                          src={iconPreview || subcategoryData.icon_image_url}
                          alt="Icon Preview"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <IconButton
                          onClick={handleRemoveIcon}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            width: 20,
                            height: 20
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    )}

                    {/* File Upload */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={uploadingIcon ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                        disabled={uploadingIcon}
                        sx={{ justifyContent: 'flex-start' }}
                        size="small"
                      >
                        {uploadingIcon ? 'Uploading...' : (selectedIconFile ? selectedIconFile.name : 'Choose Icon File')}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconFileSelect}
                          style={{ display: 'none' }}
                        />
                      </Button>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    onClick={handleCreateSubcategory}
                    variant="contained"
                    size="small"
                    disabled={loading || uploadingIcon}
                  >
                    Create
                  </Button>
                  <Button
                    onClick={handleCancelSubcategory}
                    variant="outlined"
                    size="small"
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim() || !formData.sub_category_id || !formData.coords || !canCreateMorePOIs}
        >
          {loading ? <CircularProgress size={20} /> : `Create POI (${currentMyPOIsCount}/${planLimits?.totalPOILimit === Infinity ? '∞' : planLimits?.totalPOILimit || 0})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MyPOIForm;
