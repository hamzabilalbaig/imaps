import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as ApproveIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { CATEGORY_COLORS } from '../utils/mapUtils';
import useCategoriesStore from '../stores/categories';
import useSubCategoriesStore from '../stores/subCategories';
import usePOIsStore from '../stores/pois';
import useUserStore from '../stores/user';
import uploadFile from '../aws/fileUpload';
import MyPOIForm from './MyPOIForm';
import { useAlerts } from '../hooks/useAlerts';

/**
 * Simple sidebar component displaying categories
 */
function Sidebar({ 
  searchTerm = '', 
  onSearchChange,
  onVisibilityChange,
  onMapClick,
  onRefreshMyCategories,
  onRefreshMyPOIs,
  onRefreshMySubCategories,
  myCategories = [],
  onPendingPOIClick
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Categories store
  const { 
    categories, 
    loading, 
    error, 
    fetchCategories, 
    initializeCategories 
  } = useCategoriesStore();

  // SubCategories store
  const { 
    subCategories, 
    loading: subCategoriesLoading, 
    error: subCategoriesError, 
    initializeSubCategories,
    getSubCategoriesByCategoryId,
    deleteSubCategory
  } = useSubCategoriesStore();

  // POIs store
  const { 
    pois,
    myPois,
    loading: poisLoading, 
    error: poisError, 
    initializePOIs,
    getPOIsCountBySubCategory,
    approvePOI,
    updatePOI,
    deletePOI,
    fetchPOIs,
    fetchMyPOIs,
    createMyPOI,
    getAllPOIsForDisplay,
    getMyPOICount
  } = usePOIsStore();

  // User store
  const { isadmin, id: currentUserId } = useUserStore();
  const { warning, error: showError, confirm } = useAlerts();
  const isLoggedIn = currentUserId !== null;

  const [unapprovedPois, setUnapprovedPois] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Visibility state management
  const [globalVisibility, setGlobalVisibility] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [hiddenSubCategories, setHiddenSubCategories] = useState(new Set());

  // POI management state
  const [editingPoi, setEditingPoi] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // My POI form state
  const [showMyPOIForm, setShowMyPOIForm] = useState(false);
  const [myPOIMapClickCoords, setMyPOIMapClickCoords] = useState(null);
  const [isMyPOIMapClickMode, setIsMyPOIMapClickMode] = useState(false);
  const [waitingForMyPOILocation, setWaitingForMyPOILocation] = useState(false);

  useEffect(()=>{
    setUnapprovedPois(pois.filter(poi => !poi.is_approved));
  },[pois])

  useEffect(() => {
    // Initialize categories, subcategories, and POIs when component mounts
    initializeCategories();
    initializeSubCategories();
    initializePOIs();
    
    // Initialize My POIs for the current user
    if (currentUserId && !isadmin) {
      fetchMyPOIs(currentUserId);
    }
    
    // Set all categories as expanded by default (non-collapsible)
    if (categories.length > 0) {
      const allExpanded = {};
      categories.forEach(category => {
        allExpanded[category.id] = true;
      });
      setExpandedCategories(allExpanded);
    }
  }, [initializeCategories, initializeSubCategories, initializePOIs, fetchMyPOIs, categories, currentUserId, isadmin]);

  // Auto-expand all categories when they are loaded
  useEffect(() => {
    if (categories.length > 0) {
      const allExpanded = {};
      categories.forEach(category => {
        allExpanded[category.id] = true;
      });
      setExpandedCategories(allExpanded);
    }
  }, [categories]);

  // Filter categories based on search term
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleCategoryToggle = (categoryId) => {
    // Categories are always expanded, so we toggle subcategory visibility instead
    setHiddenCategories(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(categoryId)) {
        newHidden.delete(categoryId);
      } else {
        newHidden.add(categoryId);
      }
      
      // Notify parent of visibility changes
      if (onVisibilityChange) {
        onVisibilityChange({
          hiddenCategories: newHidden,
          hiddenSubCategories,
          globalVisibility
        });
      }
      
      return newHidden;
    });
  };

  const handleSubCategoryToggle = (subCategoryId) => {
    setHiddenSubCategories(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(subCategoryId)) {
        newHidden.delete(subCategoryId);
      } else {
        newHidden.add(subCategoryId);
      }
      
      // Notify parent of visibility changes
      if (onVisibilityChange) {
        onVisibilityChange({
          hiddenCategories,
          hiddenSubCategories: newHidden,
          globalVisibility
        });
      }
      
      return newHidden;
    });
  };

  const handleShowAll = () => {
    setGlobalVisibility(true);
    setHiddenCategories(new Set());
    setHiddenSubCategories(new Set());
    
    // Notify parent of visibility changes
    if (onVisibilityChange) {
      onVisibilityChange({
        hiddenCategories: new Set(),
        hiddenSubCategories: new Set(),
        globalVisibility: true
      });
    }
  };

  const handleHideAll = () => {
    setGlobalVisibility(false);
    const allCategoryIds = new Set(categories.map(cat => cat.id));
    const allSubCategoryIds = new Set(subCategories.map(sub => sub.id));
    setHiddenCategories(allCategoryIds);
    setHiddenSubCategories(allSubCategoryIds);
    
    // Notify parent of visibility changes
    if (onVisibilityChange) {
      onVisibilityChange({
        hiddenCategories: allCategoryIds,
        hiddenSubCategories: allSubCategoryIds,
        globalVisibility: false
      });
    }
  };

  // Helper function to determine if a subcategory should be visible
  const isSubCategoryVisible = (subCategory) => {
    if (!globalVisibility) return false;
    const isCategoryHidden = hiddenCategories.has(subCategory.category_id);
    const isSubCategoryHidden = hiddenSubCategories.has(subCategory.id);
    return !isCategoryHidden && !isSubCategoryHidden;
  };

  // Helper function to determine if POIs should be visible for a subcategory
  const arePOIsVisible = (subCategory) => {
    if (!globalVisibility) return false;
    const isCategoryHidden = hiddenCategories.has(subCategory.category_id);
    const isSubCategoryHidden = hiddenSubCategories.has(subCategory.id);
    return !isCategoryHidden && !isSubCategoryHidden;
  };

  // POI management handlers
  const handleApprovePOI = async (poi) => {
    setActionLoading(true);
    try {
      const result = await approvePOI(poi.id, poi);
      if (result.success) {
        // Refresh POIs to update the list
        await fetchPOIs();
      }
    } catch (error) {
      console.error('Error approving POI:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPOI = (poi) => {
    setEditingPoi(poi);
    setImagePreview(poi.image_url || '');
    setSelectedImage(null);
    setEditDialogOpen(true);
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
        setEditingPoi(prev => ({ ...prev, image_url: uploadedUrl }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      showError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditSave = async (updatedPOI) => {
    setActionLoading(true);
    try {
      const result = await updatePOI(editingPoi.id, { ...updatedPOI, is_approved: true });
      if (result.success) {
        setEditDialogOpen(false);
        setEditingPoi(null);
        // Refresh POIs to update the list
        await fetchPOIs();
      }
    } catch (error) {
      console.error('Error updating POI:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingPoi(null);
    setImagePreview('');
    setSelectedImage(null);
  };

  // User POI management handlers
  const handleEditUserPOI = (poi) => {
    // For users, we don't auto-approve, just allow editing
    setEditingPoi(poi);
    setImagePreview(poi.image_url || '');
    setSelectedImage(null);
    setEditDialogOpen(true);
  };

  const handleDeleteUserPOI = async (poi) => {
    confirm(`Are you sure you want to delete "${poi.name}"? This action cannot be undone.`, async () => {
      setActionLoading(true);
      try {
        const result = await deletePOI(poi.id);
        if (result.success) {
          // Refresh My POIs to update the list
          if (onRefreshMyPOIs) {
            onRefreshMyPOIs();
          }
        }
      } catch (err) {
        console.error('Error deleting POI:', err);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleDeleteUserSubCategory = async (subCategory) => {
    confirm(`Are you sure you want to delete "${subCategory.name}"? This will also delete all POIs in this subcategory. This action cannot be undone.`, async () => {
      setActionLoading(true);
      try {
        const result = await deleteSubCategory(subCategory.id);
        if (result.success) {
          // Refresh My SubCategories to update the list
          if (onRefreshMySubCategories) {
            onRefreshMySubCategories();
          }
          // Also refresh POIs since deleting subcategory may affect POIs
          if (onRefreshMyPOIs) {
            onRefreshMyPOIs();
          }
        }
      } catch (err) {
        console.error('Error deleting subcategory:', err);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleMyPOIEnableMapClick = () => {
    setIsMyPOIMapClickMode(true);
    setMyPOIMapClickCoords(null);
  };

  const handleMyPOIMapClick = (coords) => {
    // Follow the exact same pattern as note and suggest location
    setMyPOIMapClickCoords(coords);
    setIsMyPOIMapClickMode(false);
    setWaitingForMyPOILocation(false);
    setShowMyPOIForm(true);
  };

  // Expose map click handler for external use
  React.useEffect(() => {
    if (onMapClick) {
      if (isMyPOIMapClickMode) {
        onMapClick(handleMyPOIMapClick);
      } else {
        onMapClick(null); // Clear the handler when not in map click mode
      }
    }
  }, [onMapClick, isMyPOIMapClickMode]);

  const handleMyPOIFormClose = () => {
    setShowMyPOIForm(false);
    setIsMyPOIMapClickMode(false);
    setMyPOIMapClickCoords(null);
    setWaitingForMyPOILocation(false);
  };

  const handleUserEditSave = async (updatedPOI) => {
    setActionLoading(true);
    try {
      // For users, we don't auto-approve - keep the current approval status
      const result = await updatePOI(editingPoi.id, { 
        ...updatedPOI, 
        is_approved: editingPoi.is_approved // Keep existing approval status
      });
      if (result.success) {
        setEditDialogOpen(false);
        setEditingPoi(null);
        // Refresh POIs to update the list
        await fetchPOIs();
      }
    } catch (error) {
      console.error('Error updating POI:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }}
    >
      
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: '1.2rem' }}>
          Categories
        </Typography>
        
        {/* Show/Hide All Buttons */}
        <Box sx={{ mb: 2 }}>
          <ButtonGroup variant="outlined" size="small" fullWidth>
            <Button
              onClick={handleShowAll}
              startIcon={<VisibilityIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              Show All
            </Button>
            <Button
              onClick={handleHideAll}
              startIcon={<VisibilityOffIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              Hide All
            </Button>
          </ButtonGroup>
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '1rem' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange && onSearchChange('')}>
                  <ClearIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ 
            mt: 1.5,
            '& .MuiInputBase-root': {
              fontSize: '0.8rem'
            }
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        minHeight: 0,
        p: 2
      }}>
        {/* Loading State */}
        {(loading || subCategoriesLoading || poisLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2, fontSize: '0.8rem' }}>
              Loading data...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {(error || subCategoriesError || poisError) && !loading && !subCategoriesLoading && !poisLoading && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
              Error loading data: {error || subCategoriesError || poisError}
            </Typography>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !subCategoriesLoading && !poisLoading && !error && !subCategoriesError && !poisError && filteredCategories.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: '1rem' }}>
              {searchTerm ? 'No categories found' : 'No Categories Available'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {searchTerm 
                ? `No categories match "${searchTerm}"`
                : "No categories have been created yet."
              }
            </Typography>
          </Box>
        )}

        {/* Categories List */}
        {!loading && !subCategoriesLoading && !poisLoading && !error && !subCategoriesError && !poisError && filteredCategories.length > 0 && (
          <>
            {/* <Typography variant="caption" sx={{ mb: 2, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
              {filteredCategories.length} Categories
            </Typography> */}
            
            {filteredCategories.map((category) => {
              const isExpanded = true; // Categories are always expanded
              const categoryColor = category.color || CATEGORY_COLORS[category.name] || CATEGORY_COLORS['Other'];
              const categorySubCategories = getSubCategoriesByCategoryId(category.id);
              const isCategoryHidden = hiddenCategories.has(category.id);

              return (
                <Accordion
                  key={category.id}
                  expanded={isExpanded}
                  onChange={() => {}} // Prevent accordion collapse
                  sx={{
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0 },
                    mb: 1,

                    '&:hover': {
                      backgroundColor: alpha(categoryColor, 0.02)
                    },
                    opacity: globalVisibility ? 1 : 0.5
                  }}
                >
                  <AccordionSummary
                    expandIcon={null} // Remove expand icon since categories don't collapse
                    onClick={() => handleCategoryToggle(category.id)}
                    sx={{
                      minHeight: 48,
                      px: 2,
                      cursor: 'pointer',
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        margin: 0
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: categoryColor,
                          mr: 1.5,
                          flexShrink: 0
                        }}
                      />
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: theme.palette.text.primary
                          }}
                        >
                          {category.name}
                        </Typography>
                        {category.description && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.75rem',
                              color: theme.palette.text.secondary,
                              display: 'block',
                              lineHeight: 1.2
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ pt: 0, px: 1, pb: 1 }}>
                    {categorySubCategories.length === 0 ? (
                      <Box sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        backgroundColor: alpha(categoryColor, 0.05),
                        borderRadius: 1,
                        border: `1px dashed ${alpha(categoryColor, 0.2)}`
                      }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: '0.8rem',
                            fontStyle: 'italic'
                          }}
                        >
                          No subcategories available
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                        p: 1
                      }}>
                        {categorySubCategories.map((subCategory) => {
                          const isSubCategoryHidden = hiddenSubCategories.has(subCategory.id);
                          const shouldShowStrikethrough = isCategoryHidden || isSubCategoryHidden;
                          
                          return (
                            <Box
                              key={subCategory.id}
                              onClick={() => handleSubCategoryToggle(subCategory.id)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1,
                                // backgroundColor: alpha(categoryColor, 0.03),
                                // border: `1px solid ${alpha(categoryColor, 0.1)}`,
                                cursor: 'pointer',
                                opacity: shouldShowStrikethrough ? 0.6 : 1,
                                '&:hover': {
                                  backgroundColor: alpha(categoryColor, 0.08),
                                  borderColor: alpha(categoryColor, 0.2)
                                }
                              }}
                            >
                              {/* Icon */}
                              <Box sx={{ mr: 1, flexShrink: 0 }}>
                                {subCategory.icon_image_url ? (
                                  <img
                                     src={subCategory.icon_image_url}
                                     alt={subCategory.name}
                                     style={{
                                       width: 20,
                                       height: 20,
                                       borderRadius: 2,
                                       filter: shouldShowStrikethrough ? 'grayscale(100%)' : 'none'
                                     }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 1,
                                      backgroundColor: subCategory.color || alpha(categoryColor, 0.4),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      filter: shouldShowStrikethrough ? 'grayscale(100%)' : 'none'
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.6rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }}
                                    >
                                      {subCategory.name.charAt(0).toUpperCase()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Content */}
                              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textDecoration: shouldShowStrikethrough ? 'line-through' : 'none'
                                  }}
                                >
                                  {subCategory.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    color: theme.palette.text.secondary,
                                    textDecoration: shouldShowStrikethrough ? 'line-through' : 'none'
                                  }}
                                >
                                  {getPOIsCountBySubCategory(subCategory.id)}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}

        {/* Unapproved POIs Section - Show for testing */}
        {(isadmin ) && ( 
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography 
              variant="caption" 
              sx={{ 
                mb: 2, 
                display: 'block', 
                fontWeight: 'bold', 
                color: 'warning.main',
                fontSize: '0.75rem'
              }}
            >
              Pending Suggested Location ({unapprovedPois.length})
            </Typography>
            
            {unapprovedPois.length === 0 ? (
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 1,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: '0.8rem' }}
                >
                  No POIs pending Suggested Location
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {unapprovedPois.map((poi) => {
                  const handlePOIClick = () => {
                    if (onPendingPOIClick && poi.coords) {
                      // Parse coordinates - they could be array or string
                      let lat, lng;
                      if (Array.isArray(poi.coords)) {
                        lat = poi.coords[0];
                        lng = poi.coords[1];
                      } else if (typeof poi.coords === 'string') {
                        const coords = poi.coords.split(',').map(coord => parseFloat(coord.trim()));
                        lat = coords[0];
                        lng = coords[1];
                      }
                      
                      if (lat !== undefined && lng !== undefined) {
                        onPendingPOIClick({
                          lat,
                          lng,
                          poi: poi // Pass the full POI data
                        });
                      }
                    }
                  };

                  return (
                <Box
                  key={poi.id}
                  onClick={handlePOIClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    cursor: onPendingPOIClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    }
                  }}
                >
                  {/* POI Info */}
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {poi.name}
                    </Typography>
                    
                    {poi.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
                          color: theme.palette.text.secondary,
                          display: 'block',
                          lineHeight: 1.2,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {poi.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label="Pending"
                        color="warning"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.65rem', 
                          height: 20,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <LocationIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        ID: {poi.id}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                    
                    <Tooltip title="Delete POI">
                      <IconButton
                        size="small"
                        onClick={() => deletePOI(poi.id)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        {actionLoading ? (
                          <CircularProgress size={14} />
                        ) : (
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit & Approve">
                      <IconButton
                        size="small"
                        onClick={() => handleEditPOI(poi)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        <EditIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Approve POI">
                      <IconButton
                        size="small"
                        onClick={() => handleApprovePOI(poi)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: 'success.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        {actionLoading ? (
                          <CircularProgress size={14} />
                        ) : (
                          <ApproveIcon sx={{ fontSize: '0.9rem' }} />
                        )}
                      </IconButton>
                    </Tooltip>

                    
                  </Box>
                </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* User POIs Management Section - Only for non-admin users */}
        {!isadmin && currentUserId && (
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold', 
                  // color: 'primary.main',
                  fontSize: '0.75rem'
                }}
              >
                My POIs ({myPois.length})
              </Typography>
            </Box>

            {/* Show map click prompt when waiting for location */}
            {waitingForMyPOILocation && (
              <Alert 
                severity="info" 
                sx={{ mt: 1, fontSize: '0.75rem' }}
                action={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setWaitingForMyPOILocation(false);
                      setIsMyPOIMapClickMode(false);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                Click anywhere on the map to add a new location
              </Alert>
            )}
            
            {myPois.length === 0 ? (
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 1,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: '0.8rem' }}
                >
                  You haven't created any POIs yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {myPois.map((poi) => (
                <Box
                  key={poi.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: poi.is_approved 
                      ? alpha(theme.palette.success.main, 0.05)
                      : alpha(theme.palette.warning.main, 0.05),
                    border: poi.is_approved 
                      ? `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      : `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    '&:hover': {
                      backgroundColor: poi.is_approved 
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.warning.main, 0.1),
                    }
                  }}
                >
                  {/* POI Info */}
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {poi.name}
                    </Typography>
                    
                    {poi.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
                          color: theme.palette.text.secondary,
                          display: 'block',
                          lineHeight: 1.2,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {poi.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* <Chip
                        size="small"
                        label={poi.is_approved ? "Approved" : "Pending"}
                        color={poi.is_approved ? "success" : "warning"}
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.65rem', 
                          height: 20,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      /> */}
                      <LocationIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        ID: {poi.id}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Buttons - Only Edit and Delete for users */}
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                    {/* <Tooltip title="Edit POI">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUserPOI(poi)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        <EditIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip> */}

                    <Tooltip title="Delete POI">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUserPOI(poi)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        {actionLoading ? (
                          <CircularProgress size={14} />
                        ) : (
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
              </Box>
            )}
          </Box>
        )}

        {/* User SubCategories Management Section - Only for non-admin users */}
        {!isadmin && currentUserId && myCategories.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold', 
                  // color: 'secondary.main',
                  fontSize: '0.75rem'
                }}
              >
                My SubCategories ({myCategories.length})
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {myCategories.map((subCategory) => (
                <Box
                  key={subCategory.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    }
                  }}
                >
                  {/* SubCategory Info */}
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {subCategory.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: subCategory.color || theme.palette.secondary.main,
                          flexShrink: 0
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        ID: {subCategory.id}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Buttons - Only Delete for user subcategories */}
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                    <Tooltip title="Delete SubCategory">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUserSubCategory(subCategory)}
                        disabled={actionLoading}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                          },
                          width: 28,
                          height: 28
                        }}
                      >
                        {actionLoading ? (
                          <CircularProgress size={14} />
                        ) : (
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

       

        {/* Edit POI Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleEditCancel}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 1
          }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {isadmin ? 'Edit & Approve POI' : 'Edit POI'}
            </Typography>
            <IconButton onClick={handleEditCancel} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            {editingPoi && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="POI Name"
                  value={editingPoi.name || ''}
                  onChange={(e) => setEditingPoi(prev => ({ ...prev, name: e.target.value }))}
                  size="small"
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  value={editingPoi.description || ''}
                  onChange={(e) => setEditingPoi(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  size="small"
                />
                
                <TextField
                  fullWidth
                  select
                  label="Sub Category"
                  value={editingPoi.sub_category_id || ''}
                  onChange={(e) => setEditingPoi(prev => ({ ...prev, sub_category_id: e.target.value }))}
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select a subcategory</option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </option>
                  ))}
                </TextField>

                {/* Image Upload Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                    POI Image
                  </Typography>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploadingImage ? <CircularProgress size={16} /> : <UploadIcon />}
                    disabled={uploadingImage}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>

                  {imagePreview && (
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.paper, 0.5)
                    }}>
                      <img 
                        src={imagePreview} 
                        alt="POI Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 200, 
                          borderRadius: 8,
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        Image preview
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    onClick={handleEditCancel}
                    disabled={actionLoading}
                    variant="outlined"
                    size="small"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => isadmin ? handleEditSave(editingPoi) : handleUserEditSave(editingPoi)}
                    disabled={actionLoading || !editingPoi.name || !editingPoi.sub_category_id}
                    variant="contained"
                    size="small"
                    startIcon={actionLoading ? <CircularProgress size={16} /> : <EditIcon />}
                  >
                    {isadmin ? 'Update & Approve' : 'Update POI'}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* My POI Form */}
        <MyPOIForm
          open={showMyPOIForm}
          onClose={handleMyPOIFormClose}
          mapClickCoords={myPOIMapClickCoords}
          onSuccess={(newPOI) => {
            // Refresh My POIs after successful creation
            fetchMyPOIs(currentUserId);
            // Also refresh My Categories in case a new subcategory was created
            if (onRefreshMyCategories) {
              onRefreshMyCategories();
            }
            handleMyPOIFormClose();
          }}
        />
      </Box>

      {/* Footer */}
      {/* <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {loading || subCategoriesLoading || poisLoading ? 'Loading...' : 
            `${categories.length} categories, ${subCategories.length} subcategories, ${pois.length} POIs`
          }
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
          Hidden: {hiddenCategories.size} categories, {hiddenSubCategories.size} subcategories
        </Typography>
      </Box> */}
    </Box>
  );
}

export default Sidebar;
