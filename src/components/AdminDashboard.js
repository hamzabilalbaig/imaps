import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Tooltip,
  Fab,
  Badge,
  Stack,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Map as MapIcon,
  AttachMoney as MoneyIcon,
  NotificationsActive as NotificationIcon,
  Refresh as RefreshIcon,
  AccountTree as SubCategoryIcon,
  ColorLens as ColorIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useUserStore, { getPlanLimits } from '../stores/user';
import usePOIsStore from '../stores/pois';
import useCategoriesStore from '../stores/categories';
import useSubCategoriesStore from '../stores/subCategories';
import { getAllUsers, updateUserPlan, getAdminStats, bulkApprovePOIs, bulkRejectPOIs, getAllPlanConfigurations, updatePlanConfiguration, createPlanConfiguration, deletePlanConfiguration, getPlanUsageStats, getAllMapLayers, createMapLayer, updateMapLayer, deleteMapLayer, uploadMapLayerImage } from '../api/functions/apiFunctions';
import uploadFile from '../aws/fileUpload';
import { generateShareableLink } from '../utils/mapUtils';
import { useAlerts } from '../hooks/useAlerts';

/**
 * Comprehensive Admin Dashboard Component
 */
function AdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Store hooks
  const { id, name, email, role, initializeUser, isUserAdmin } = useUserStore();
  const { pois, initializePOIs, approvePOI, deletePOI } = usePOIsStore();
  const { categories, initializeCategories, createCategory, updateCategory, deleteCategory } = useCategoriesStore();
  const { subCategories, initializeSubCategories, createSubCategory, updateSubCategory, deleteSubCategory } = useSubCategoriesStore();
  
  // Alerts hook
  const { confirm, success, error } = useAlerts();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPlanDialogOpen, setEditPlanDialogOpen] = useState(false);
  const [editPlanLimitsDialogOpen, setEditPlanLimitsDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedPOIs, setSelectedPOIs] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Category and SubCategory management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  const [subCategoryFormData, setSubCategoryFormData] = useState({ 
    name: '', 
    color: '#1976d2', 
    icon_image_url: '', 
    category_id: '' 
  });
  const [selectedIconFile, setSelectedIconFile] = useState(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPOIs: 0,
    pendingPOIs: 0,
    approvedPOIs: 0,
    totalCategories: 0,
    activeUsers: 0
  });
  
  // Custom plan limits (editable by admin)
  const [customPlanLimits, setCustomPlanLimits] = useState({});
  
  // Plan management state
  const [planConfigurations, setPlanConfigurations] = useState([]);
  const [planFormData, setPlanFormData] = useState({
    plan_name: '',
    max_custom_categories: 10,
    max_pois_per_category: 10,
    total_poi_limit: 100,
    allow_custom_icons: false,
    price_cents: 0,
    description: '',
    is_active: true
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planUsageStats, setPlanUsageStats] = useState([]);

  // Map Layers management state
  const [mapLayers, setMapLayers] = useState([]);
  const [mapLayerDialogOpen, setMapLayerDialogOpen] = useState(false);
  const [selectedMapLayer, setSelectedMapLayer] = useState(null);
  const [mapLayerFormData, setMapLayerFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [iconUploadLoading, setIconUploadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await initializeUser();
        if (!isUserAdmin()) {
          navigate('/map');
          return;
        }
        
        await Promise.all([
          initializePOIs(),
          initializeCategories(),
          initializeSubCategories(),
          loadUsers(),
          loadPlanConfigurations(),
          loadMapLayers()
        ]);
        
        // Load plan limits after initialization
        const currentPlanLimits = getPlanLimits();
        if (currentPlanLimits) {
          setCustomPlanLimits(currentPlanLimits);
        }
        
        calculateStats();
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [initializeUser, isUserAdmin, navigate, initializePOIs, initializeCategories, initializeSubCategories]);

  // Load users from API
  const loadUsers = async () => {
    try {
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load plan configurations from API
  const loadPlanConfigurations = async () => {
    try {
      const [planConfigs, usageStats] = await Promise.all([
        getAllPlanConfigurations(),
        getPlanUsageStats()
      ]);
      setPlanConfigurations(planConfigs);
      setPlanUsageStats(usageStats);
    } catch (error) {
      console.error('Error loading plan configurations:', error);
    }
  };

  // Load map layers from API
  const loadMapLayers = async () => {
    try {
      const layersData = await getAllMapLayers();
      setMapLayers(layersData);
    } catch (error) {
      console.error('Error loading map layers:', error);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = () => {
    const pendingPOIs = pois.filter(poi => !poi.is_approved).length;
    const approvedPOIs = pois.filter(poi => poi.is_approved).length;
    const activeUsers = users.filter(user => {
      const lastActivity = new Date(user.updatedAt || user.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastActivity > thirtyDaysAgo;
    }).length;

    setStats({
      totalUsers: users.length,
      totalPOIs: pois.length,
      pendingPOIs,
      approvedPOIs,
      totalCategories: categories.length,
      activeUsers
    });
  };

  // Recalculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [pois, users, categories]);

  // Handle POI approval
  const handleApprovePOI = async (poiId) => {
    try {
      await approvePOI(poiId);
      setSnackbar({
        open: true,
        message: 'POI approved successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error approving POI',
        severity: 'error'
      });
    }
  };

  // Handle POI rejection/deletion
  const handleRejectPOI = async (poiId) => {
    try {
      await deletePOI(poiId);
      setSnackbar({
        open: true,
        message: 'POI rejected and deleted',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error rejecting POI',
        severity: 'error'
      });
    }
  };

  // Handle bulk POI actions
  const handleBulkAction = async (action) => {
    try {
      if (action === 'approve') {
        await bulkApprovePOIs(selectedPOIs);
      } else {
        await bulkRejectPOIs(selectedPOIs);
      }
      
      // Refresh POIs data
      await initializePOIs();
      
      setSnackbar({
        open: true,
        message: `${selectedPOIs.length} POIs ${action === 'approve' ? 'approved' : 'rejected'} successfully!`,
        severity: 'success'
      });
      
      setSelectedPOIs([]);
      setBulkActionDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error performing bulk ${action}`,
        severity: 'error'
      });
    }
  };

  // Handle user plan change
  const handleChangePlan = async (userId, newPlan) => {
    try {
      await updateUserPlan(userId, newPlan);
      await loadUsers(); // Refresh users list
      setSnackbar({
        open: true,
        message: 'User plan updated successfully!',
        severity: 'success'
      });
      setEditPlanDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating user plan',
        severity: 'error'
      });
    }
  };

  // Category Management Functions
  const handleCreateCategory = async () => {
    try {
      const result = await createCategory(categoryFormData);
      if (result.success) {
        await initializeCategories();
        setSnackbar({
          open: true,
          message: 'Category created successfully!',
          severity: 'success'
        });
        setCategoryDialogOpen(false);
        setCategoryFormData({ name: '', description: '' });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error creating category',
        severity: 'error'
      });
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const result = await updateCategory(selectedCategory.id, categoryFormData);
      if (result.success) {
        await initializeCategories();
        setSnackbar({
          open: true,
          message: 'Category updated successfully!',
          severity: 'success'
        });
        setCategoryDialogOpen(false);
        setCategoryFormData({ name: '', description: '' });
        setSelectedCategory(null);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating category',
        severity: 'error'
      });
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      try {
        const result = await deleteCategory(categoryId);
        if (result.success) {
          await initializeCategories();
          setSnackbar({
            open: true,
            message: 'Category deleted successfully!',
            severity: 'success'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error deleting category',
          severity: 'error'
        });
      }
    }
  };

  // SubCategory Management Functions
  const handleCreateSubCategory = async () => {
    try {
      // Use the S3 URL from form data instead of the preview URL
      let finalFormData = { ...subCategoryFormData };
      
      const result = await createSubCategory(finalFormData);
      if (result.success) {
        await initializeSubCategories();
        setSnackbar({
          open: true,
          message: 'Sub Category created successfully!',
          severity: 'success'
        });
        setSubCategoryDialogOpen(false);
        setSubCategoryFormData({ name: '', color: '#1976d2', icon_image_url: '', category_id: '' });
        clearSelectedIcon();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error creating sub category',
        severity: 'error'
      });
    }
  };

  const handleUpdateSubCategory = async () => {
    try {
      // Use the S3 URL from form data instead of the preview URL
      let finalFormData = { ...subCategoryFormData };
      
      const result = await updateSubCategory(selectedSubCategory.id, finalFormData);
      if (result.success) {
        await initializeSubCategories();
        setSnackbar({
          open: true,
          message: 'Sub Category updated successfully!',
          severity: 'success'
        });
        setSubCategoryDialogOpen(false);
        setSubCategoryFormData({ name: '', color: '#1976d2', icon_image_url: '', category_id: '' });
        setSelectedSubCategory(null);
        clearSelectedIcon();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating sub category',
        severity: 'error'
      });
    }
  };

  const handleDeleteSubCategory = async (subCategoryId, subCategoryName) => {
    if (window.confirm(`Are you sure you want to delete the subcategory "${subCategoryName}"? This action cannot be undone.`)) {
      try {
        const result = await deleteSubCategory(subCategoryId);
        if (result.success) {
          await initializeSubCategories();
          setSnackbar({
            open: true,
            message: 'Sub Category deleted successfully!',
            severity: 'success'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error deleting sub category',
          severity: 'error'
        });
      }
    }
  };

  const openCategoryDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({ name: '', description: '' });
    }
    setCategoryDialogOpen(true);
  };

  const openSubCategoryDialog = (subCategory = null) => {
    if (subCategory) {
      setSelectedSubCategory(subCategory);
      setSubCategoryFormData({
        name: subCategory.name || '',
        color: subCategory.color || '#1976d2',
        icon_image_url: subCategory.icon_image_url || '',
        category_id: subCategory.category_id || ''
      });
      // If editing and there's an existing icon URL, show it as preview
      if (subCategory.icon_image_url) {
        setIconPreviewUrl(subCategory.icon_image_url);
      }
    } else {
      setSelectedSubCategory(null);
      setSubCategoryFormData({ name: '', color: '#1976d2', icon_image_url: '', category_id: '' });
      clearSelectedIcon();
    }
    setSubCategoryDialogOpen(true);
  };

  // Helper function to format Dropbox URLs
  const formatDropboxUrl = (url) => {
    if (!url) return url;
    
    // If it's a Dropbox share link, convert it to direct link
    if (url.includes('dropbox.com') && url.includes('/s/') && !url.includes('?raw=1')) {
      // Replace ?dl=0 with ?raw=1 or add ?raw=1 if no query params
      if (url.includes('?dl=0')) {
        return url.replace('?dl=0', '?raw=1');
      } else if (!url.includes('?')) {
        return url + '?raw=1';
      }
    }
    
    return url;
  };

  // Update the subcategory form URL when it changes
  const handleIconUrlChange = (url) => {
    const formattedUrl = formatDropboxUrl(url);
    setSubCategoryFormData({ ...subCategoryFormData, icon_image_url: formattedUrl });
  };

  // File upload handlers
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedIconFile(file);
      
      // Create preview URL for immediate display
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Upload file to S3 immediately
      try {
        setIconUploadLoading(true);
        const uploadedUrl = await uploadFile(file, () => {});
        if (uploadedUrl) {
          setSubCategoryFormData({ 
            ...subCategoryFormData, 
            icon_image_url: uploadedUrl 
          });
        }
      } catch (error) {
        console.error('Error uploading icon to S3:', error);
        setSnackbar({
          open: true,
          message: 'Failed to upload icon',
          severity: 'error'
        });
      } finally {
        setIconUploadLoading(false);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a valid image file',
        severity: 'error'
      });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearSelectedIcon = () => {
    setSelectedIconFile(null);
    setIconPreviewUrl(null);
    setSubCategoryFormData({ ...subCategoryFormData, icon_image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Plan management handlers
  const handleUpdatePlan = async () => {
    try {
      await updatePlanConfiguration(selectedPlan.plan_name, planFormData);
      setSnackbar({
        open: true,
        message: 'Plan updated successfully! Changes will be reflected on the pricing page.',
        severity: 'success'
      });
      setEditPlanLimitsDialogOpen(false);
      setSelectedPlan(null);
      await loadPlanConfigurations();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error updating plan',
        severity: 'error'
      });
    }
  };

  const openPlanDialog = (plan) => {
    if (!plan) return; // Only allow editing existing plans
    
    setSelectedPlan(plan);
    setPlanFormData({
      plan_name: plan.plan_name || '',
      max_custom_categories: plan.max_custom_categories || 10,
      max_pois_per_category: plan.max_pois_per_category || 10,
      total_poi_limit: plan.total_poi_limit || 100,
      allow_custom_icons: plan.allow_custom_icons || false,
      price_cents: plan.price_cents || 0,
      description: plan.description || '',
      is_active: plan.is_active !== undefined ? plan.is_active : true
    });
    setEditPlanLimitsDialogOpen(true);
  };

  // Render statistics cards
  const renderStatsCards = () => {
    const statsData = [
      {
        title: 'Total Users',
        value: stats.totalUsers,
        icon: <PeopleIcon />,
        color: theme.palette.primary.main,
        trend: '+12% this month'
      },
      {
        title: 'Total POIs',
        value: stats.totalPOIs,
        icon: <LocationIcon />,
        color: theme.palette.info.main,
        trend: `${stats.pendingPOIs} pending`
      },
      {
        title: 'Pending Approval',
        value: stats.pendingPOIs,
        icon: <NotificationIcon />,
        color: theme.palette.warning.main,
        trend: 'Needs attention'
      },
      {
        title: 'Categories',
        value: stats.totalCategories,
        icon: <CategoryIcon />,
        color: theme.palette.success.main,
        trend: 'System wide'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={0}
              sx={{
                height: '100%',
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ mb: 1 }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant="h3" 
                      fontWeight={700}
                      sx={{ mb: 1, lineHeight: 1 }}
                    >
                      {card.value}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {card.trend}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: alpha(card.color, 0.1),
                      color: card.color,
                      width: 48,
                      height: 48,
                      ml: 2
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };  // Render pending POIs table
  const renderPendingPOIs = () => {
    const pendingPOIs = pois.filter(poi => !poi.is_approved);

    return (
      <Card 
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Pending POIs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pendingPOIs.length} locations awaiting approval
              </Typography>
            </Box>
            {selectedPOIs.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => setBulkActionDialogOpen(true)}
                  startIcon={<ApproveIcon />}
                  sx={{ height: 32 }}
                >
                  Approve ({selectedPOIs.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setBulkActionDialogOpen(true)}
                  startIcon={<RejectIcon />}
                  sx={{ height: 32 }}
                >
                  Reject ({selectedPOIs.length})
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        {pendingPOIs.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No pending POIs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All submissions have been reviewed
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 48 }}>
                    <input
                      type="checkbox"
                      checked={selectedPOIs.length === pendingPOIs.length && pendingPOIs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPOIs(pendingPOIs.map(poi => poi.id));
                        } else {
                          setSelectedPOIs([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Submitted By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPOIs.map((poi) => {
                  const subCategory = subCategories.find(sub => sub.id === poi.sub_category_id);
                  const category = categories.find(cat => cat.id === subCategory?.category_id);
                  
                  return (
                    <TableRow 
                      key={poi.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.04) 
                        } 
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPOIs.includes(poi.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPOIs([...selectedPOIs, poi.id]);
                            } else {
                              setSelectedPOIs(selectedPOIs.filter(id => id !== poi.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {poi.name}
                          </Typography>
                          {poi.description && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {poi.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category?.name || 'Unknown'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          User #{poi.user_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(poi.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprovePOI(poi.id)}
                            >
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRejectPOI(poi.id)}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    );
  };

  // Render users management table
  const renderUsersTable = () => {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            User Management ({users.length} users)
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>POIs Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const userPOIs = pois.filter(poi => poi.user_id === user.id);
                  const isActive = new Date(user.updatedAt || user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {user.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.plan}
                          size="small"
                          color={user.plan === 'unlimited' ? 'primary' : user.plan === 'premium' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userPOIs.length}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.createdat).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Change Plan">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditPlanDialogOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {/* <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip> */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Render plan management section
  const renderPlanManagement = () => {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Plan Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Edit subscription plan configurations and pricing
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {planUsageStats.map((plan) => (
            <Grid item xs={12} lg={4} md={6} key={plan.plan_name}>
              <Card 
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: plan.is_active ? 'primary.main' : 'divider',
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  opacity: plan.is_active ? 1 : 0.6,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[6]
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={600} textTransform="capitalize">
                          {plan.plan_name} Plan
                        </Typography>
                        {!plan.is_active && (
                          <Chip label="Inactive" size="small" color="default" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {plan.user_count} users • ${(plan.price_cents / 100).toFixed(2)}/month
                      </Typography>
                      {plan.description && (
                        <Typography variant="caption" color="text.secondary">
                          {plan.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Plan Configuration">
                        <IconButton
                          size="small"
                          onClick={() => openPlanDialog(plan)}
                          sx={{ 
                            border: 1, 
                            borderColor: 'divider',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Max Categories
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {plan.max_custom_categories === -1 ? '∞' : plan.max_custom_categories}
                      </Typography>
                    </Box>
                    
                    {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        POIs per Category (Deprecated)
                      </Typography>
                      <Typography variant="body2" fontWeight={500} color="text.disabled">
                        {plan.max_pois_per_category === -1 ? '∞' : plan.max_pois_per_category}
                      </Typography>
                    </Box> */}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total POI Limit
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {plan.total_poi_limit === -1 ? '∞' : plan.total_poi_limit}
                      </Typography>
                    </Box>
                    
                    {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Custom Icons
                      </Typography>
                      <Chip
                        label={plan.allow_custom_icons ? 'Enabled' : 'Disabled'}
                        size="small"
                        variant="outlined"
                        color={plan.allow_custom_icons ? 'success' : 'default'}
                      />
                    </Box> */}

                    {plan.user_count > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{plan.user_count}</strong> user{plan.user_count !== 1 ? 's' : ''} currently on this plan
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {planUsageStats.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                border: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
                borderRadius: 2,
                bgcolor: 'action.hover'
              }}>
                <MoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Plans Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please contact system administrator to configure plans
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Render Categories Management
  const renderCategoriesManagement = () => {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Category Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage system categories
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCategoryDialog()}
              sx={{ height: 36 }}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        <Card 
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sub Categories</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => {
                  const subCategoryCount = subCategories.filter(sub => sub.category_id === category.id).length;
                  
                  return (
                    <TableRow 
                      key={category.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.04) 
                        } 
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${subCategoryCount} subcategories`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(category.created_at || Date.now()).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Category">
                            <IconButton
                              size="small"
                              onClick={() => openCategoryDialog(category)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Category">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  };

  // Render SubCategories Management
  const renderSubCategoriesManagement = () => {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Sub Category Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage subcategories within categories
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openSubCategoryDialog()}
              sx={{ height: 36 }}
            >
              Add Sub Category
            </Button>
          </Box>
        </Box>

        <Card 
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Icon</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subCategories.map((subCategory) => {
                  const category = categories.find(cat => cat.id === subCategory.category_id);
                  
                  return (
                    <TableRow 
                      key={subCategory.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.04) 
                        } 
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {subCategory.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category?.name || 'Unknown'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: 1, 
                              backgroundColor: subCategory.color || '#1976d2',
                              border: 1,
                              borderColor: 'divider'
                            }} 
                          />
                          <Typography variant="body2" color="text.secondary">
                            {subCategory.color || '#1976d2'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {subCategory.icon_image_url && (
                            <img 
                              src={subCategory.icon_image_url} 
                              alt="Icon preview"
                              style={{ 
                                width: 20, 
                                height: 20, 
                                objectFit: 'contain',
                                borderRadius: 2
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              maxWidth: 120,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {subCategory.icon_image_url ? (
                              subCategory.icon_image_url.includes('dropbox.com') ? 
                              'Dropbox Image' : 
                              subCategory.icon_image_url
                            ) : 'No icon'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(subCategory.created_at || Date.now()).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Sub Category">
                            <IconButton
                              size="small"
                              onClick={() => openSubCategoryDialog(subCategory)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Sub Category">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteSubCategory(subCategory.id, subCategory.name)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  };

  // Render POIs management
  const renderPOIsManagement = () => {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                POI Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage all Points of Interest ({pois.length} total)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => initializePOIs()}
                sx={{ height: 36 }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>

        <Card 
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          {pois.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No POIs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No Points of Interest have been created yet
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sub Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Submitted By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pois.map((poi) => {
                    const subCategory = subCategories.find(sub => sub.id === poi.sub_category_id);
                    const category = categories.find(cat => cat.id === subCategory?.category_id);
                    
                    return (
                      <TableRow 
                        key={poi.id}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: alpha(theme.palette.primary.main, 0.04) 
                          } 
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {poi.image_url && (
                              <Avatar
                                src={poi.image_url}
                                sx={{ width: 32, height: 32 }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {poi.name}
                              </Typography>
                              {poi.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {poi.description.length > 50 
                                    ? `${poi.description.substring(0, 50)}...` 
                                    : poi.description
                                  }
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {category?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {subCategory?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={poi.is_approved ? 'Approved' : 'Pending'}
                            size="small"
                            color={poi.is_approved ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            User #{poi.user_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(poi.created_at || Date.now()).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!poi.is_approved && (
                              <Tooltip title="Approve POI">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => approvePOI(poi.id)}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View POI">
                              <IconButton
                                size="small"
                                onClick={()=>{
                                  const link = generateShareableLink(poi);
                                  window.location.href = link;
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete POI">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${poi.name}"?`)) {
                                    deletePOI(poi.id);
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    );
  };

  // Render Map Layers management
  const renderMapLayersManagement = () => {
    const filteredLayers = mapLayers.filter(layer => 
      layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (layer.description && layer.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleImageFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedImageFile(file);
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleCreateMapLayer = async () => {
      if (!mapLayerFormData.name) {
        error('Layer name is required');
        return;
      }

      try {
        setImageUploadLoading(true);
        let imageUrl = '';

        if (selectedImageFile) {
          try {
            // Upload file directly to S3 from the client and get back a public URL
            const fileUrl = await uploadFile(selectedImageFile, setImageUploadLoading);
            if (!fileUrl) {
              throw new Error('S3 upload failed or returned empty URL');
            }
            imageUrl = fileUrl;

            // Create the layer with the S3 URL (no base64)
            const layerData = {
              name: mapLayerFormData.name,
              description: mapLayerFormData.description,
              image_url: imageUrl,
              created_by: id
            };

            await createMapLayer(layerData);
            await loadMapLayers();

            // Reset form
            setMapLayerFormData({ name: '', description: '', image_url: '' });
            setSelectedImageFile(null);
            setImagePreviewUrl(null);
            setMapLayerDialogOpen(false);

            success('Map layer created successfully!');
          } catch (error) {
            console.error('Error creating map layer:', error);
            error('Failed to create map layer');
          } finally {
            setImageUploadLoading(false);
          }
        } else {
          error('Please select an image file');
          setImageUploadLoading(false);
        }
      } catch (error) {
        console.error('Error creating map layer:', error);
        error('Failed to create map layer');
        setImageUploadLoading(false);
      }
    };

    const handleUpdateMapLayer = async () => {
      if (!selectedMapLayer || !mapLayerFormData.name) {
        error('Layer name is required');
        return;
      }

      try {
        setImageUploadLoading(true);
        let imageUrl = mapLayerFormData.image_url;

        if (selectedImageFile) {
          try {
            // Upload file directly to S3 from the client and get back a public URL
            const fileUrl = await uploadFile(selectedImageFile, setImageUploadLoading);
            if (!fileUrl) {
              throw new Error('S3 upload failed or returned empty URL');
            }
            imageUrl = fileUrl;

            // Update the layer with the S3 URL (no base64)
            const layerData = {
              name: mapLayerFormData.name,
              description: mapLayerFormData.description,
              image_url: imageUrl
            };

            await updateMapLayer(selectedMapLayer.id, layerData);
            await loadMapLayers();

            // Reset form
            setMapLayerFormData({ name: '', description: '', image_url: '' });
            setSelectedImageFile(null);
            setImagePreviewUrl(null);
            setSelectedMapLayer(null);
            setMapLayerDialogOpen(false);

            success('Map layer updated successfully!');
          } catch (error) {
            console.error('Error updating map layer:', error);
            error('Failed to update map layer');
          } finally {
            setImageUploadLoading(false);
          }
        } else {
          // No new image, just update text fields
          const layerData = {
            name: mapLayerFormData.name,
            description: mapLayerFormData.description,
            image_url: imageUrl
          };

          await updateMapLayer(selectedMapLayer.id, layerData);
          await loadMapLayers();
          
          // Reset form
          setMapLayerFormData({ name: '', description: '', image_url: '' });
          setSelectedMapLayer(null);
          setMapLayerDialogOpen(false);
          setImageUploadLoading(false);
          
          success('Map layer updated successfully!');
        }
      } catch (error) {
        console.error('Error updating map layer:', error);
        error('Failed to update map layer');
        setImageUploadLoading(false);
      }
    };

    const handleDeleteMapLayer = async (layer) => {
      const confirmed = await confirm(`Are you sure you want to delete "${layer.name}"?`);
      if (confirmed) {
        try {
          await deleteMapLayer(layer.id);
          await loadMapLayers();
          success('Map layer deleted successfully!');
        } catch (error) {
          console.error('Error deleting map layer:', error);
          error('Failed to delete map layer');
        }
      }
    };

    const handleEditMapLayer = (layer) => {
      setSelectedMapLayer(layer);
      setMapLayerFormData({
        name: layer.name,
        description: layer.description || '',
        image_url: layer.image_url
      });
      setImagePreviewUrl(layer.image_url);
      setMapLayerDialogOpen(true);
    };

    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Map Layers Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage base map images for the application ({mapLayers.length} total)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedMapLayer(null);
                  setMapLayerFormData({ name: '', description: '', image_url: '' });
                  setSelectedImageFile(null);
                  setImagePreviewUrl(null);
                  setMapLayerDialogOpen(true);
                }}
                sx={{ height: 36 }}
              >
                Add Layer
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadMapLayers}
                sx={{ height: 36 }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search layers by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ViewIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </Box>

        <Card 
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          {filteredLayers.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchTerm ? 'No layers match your search' : 'No map layers found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first map layer to get started'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Preview</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    {/* <TableCell>Upload Method</TableCell> */}
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLayers.map((layer) => {
                    const isBase64 = layer.image_url && layer.image_url.startsWith('data:');
                    return (
                      <TableRow key={layer.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              width: 60,
                              height: 40,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              overflow: 'hidden',
                              backgroundColor: 'grey.100'
                            }}
                          >
                            <img
                              src={layer.image_url}
                              alt={layer.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <Box
                              sx={{
                                display: 'none',
                                width: '100%',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'grey.200'
                              }}
                            >
                              <ImageIcon sx={{ color: 'grey.400', fontSize: 20 }} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {layer.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {layer.description || 'No description'}
                          </Typography>
                        </TableCell>
                        {/* <TableCell>
                          <Chip
                            label={isBase64 ? 'Base64' : 'S3'}
                            size="small"
                            color={isBase64 ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </TableCell> */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(layer.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditMapLayer(layer)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMapLayer(layer)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Add/Edit Map Layer Dialog */}
        <Dialog
          open={mapLayerDialogOpen}
          onClose={() => {
            if (!imageUploadLoading) {
              setMapLayerDialogOpen(false);
              setSelectedMapLayer(null);
              setMapLayerFormData({ name: '', description: '', image_url: '' });
              setSelectedImageFile(null);
              setImagePreviewUrl(null);
            }
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedMapLayer ? 'Edit Map Layer' : 'Add New Map Layer'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Layer Name"
                value={mapLayerFormData.name}
                onChange={(e) => setMapLayerFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                disabled={imageUploadLoading}
              />
              
              <TextField
                label="Description"
                value={mapLayerFormData.description}
                onChange={(e) => setMapLayerFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                disabled={imageUploadLoading}
              />

              {/* Image Upload */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Map Image *
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={imageUploadLoading}
                    sx={{ minWidth: 150 }}
                  >
                    Choose Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageFileSelect}
                    />
                  </Button>
                  
                  {(imagePreviewUrl || selectedImageFile) && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Preview:
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 400,
                          height: 200,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          backgroundColor: 'grey.100'
                        }}
                      >
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedMapLayer 
                    ? 'Leave empty to keep current image. Upload new image to replace.'
                    : 'Select a PNG, JPG, or other image file for the map layer.'
                  }
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                if (!imageUploadLoading) {
                  setMapLayerDialogOpen(false);
                  setSelectedMapLayer(null);
                  setMapLayerFormData({ name: '', description: '', image_url: '' });
                  setSelectedImageFile(null);
                  setImagePreviewUrl(null);
                }
              }}
              disabled={imageUploadLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={selectedMapLayer ? handleUpdateMapLayer : handleCreateMapLayer}
              variant="contained"
              disabled={imageUploadLoading || !mapLayerFormData.name || (!selectedMapLayer && !selectedImageFile)}
              startIcon={imageUploadLoading ? <LinearProgress size={20} /> : <SaveIcon />}
            >
              {imageUploadLoading ? 'Uploading...' : (selectedMapLayer ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  // Tab panel content
  const getTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            {renderStatsCards()}
            <Box sx={{ mb: 3 }}>
              {renderPendingPOIs()}
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            {renderUsersTable()}
          </Box>
        );
      case 2:
        return (
          <Box>
            {renderPlanManagement()}
          </Box>
        );
      case 3:
        return (
          <Box>
            {renderCategoriesManagement()}
          </Box>
        );
      case 4:
        return (
          <Box>
            {renderSubCategoriesManagement()}
          </Box>
        );
      case 5:
        return (
          <Box>
            {renderPOIsManagement()}
          </Box>
        );
      case 6:
        return (
          <Box>
            {renderMapLayersManagement()}
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading admin dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: theme.palette.background.paper,
        borderBottom: 1,
        borderColor: 'divider',
        px: 3,
        py: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="600" sx={{ mb: 0.5 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage users, POIs, and system settings
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<MapIcon />}
              onClick={() => navigate('/admin-map')}
              sx={{ height: 36 }}
            >
              Map View
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadUsers();
                initializePOIs();
              }}
              sx={{ height: 36 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ mt: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500
              }
            }}
          >
            <Tab
              icon={<DashboardIcon />}
              label="Overview"
              iconPosition="start"
            />
            <Tab
              icon={<PeopleIcon />}
              label="Users"
              iconPosition="start"
            />
            <Tab
              icon={<MoneyIcon />}
              label="Plans"
              iconPosition="start"
            />
            <Tab
              icon={<CategoryIcon />}
              label="Categories"
              iconPosition="start"
            />
            <Tab
              icon={<SubCategoryIcon />}
              label="Sub Categories"
              iconPosition="start"
            />
            <Tab
              icon={<LocationIcon />}
              label="POIs"
              iconPosition="start"
            />
            <Tab
              icon={<ImageIcon />}
              label="Map Layers"
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ p: 3 }}>
        {getTabContent()}
      </Box>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/admin-map')}
      >
        <MapIcon />
      </Fab>

      {/* Plan Edit Dialog */}
      <Dialog
        open={editPlanDialogOpen}
        onClose={() => setEditPlanDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change User Plan</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Changing plan for: {selectedUser.name} ({selectedUser.email})
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={selectedUser.plan || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, plan: e.target.value })}
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="unlimited">Unlimited</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPlanDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleChangePlan(selectedUser.id, selectedUser.plan)}
          >
            Update Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Action Confirmation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to perform this action on {selectedPOIs.length} selected POIs?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleBulkAction('approve')}
          >
            Approve All
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleBulkAction('reject')}
          >
            Reject All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Create New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={selectedCategory ? handleUpdateCategory : handleCreateCategory}
            disabled={!categoryFormData.name.trim()}
          >
            {selectedCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SubCategory Dialog */}
      <Dialog
        open={subCategoryDialogOpen}
        onClose={() => {
          setSubCategoryDialogOpen(false);
          clearSelectedIcon();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedSubCategory ? 'Edit Sub Category' : 'Create New Sub Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Sub Category Name"
              value={subCategoryFormData.name}
              onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={subCategoryFormData.category_id}
                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Color"
                type="color"
                value={subCategoryFormData.color}
                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, color: e.target.value })}
                sx={{ width: 100 }}
              />
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Color Hex"
                  value={subCategoryFormData.color}
                  onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, color: e.target.value })}
                  fullWidth
                  placeholder="#1976d2"
                />
              </Box>
            </Box>
            
            {/* Image Upload Dropzone */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Icon Image
              </Typography>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <Box
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: 2,
                  borderColor: selectedIconFile ? 'success.main' : 'divider',
                  borderStyle: 'dashed',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedIconFile ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.primary.main, 0.04),
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                {iconPreviewUrl ? (
                  <Stack spacing={2} alignItems="center">
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={iconPreviewUrl}
                        alt="Icon preview"
                        style={{
                          maxWidth: 80,
                          maxHeight: 80,
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelectedIcon();
                        }}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'error.dark'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {selectedIconFile?.name || 'Current icon'}
                    </Typography>
                    {iconUploadLoading ? (
                      <Typography variant="caption" color="primary">
                        Uploading to S3...
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Click to change or drag a new image
                      </Typography>
                    )}
                  </Stack>
                ) : iconUploadLoading ? (
                  <Stack spacing={2} alignItems="center">
                    <CircularProgress size={48} />
                    <Typography variant="body1" color="text.primary">
                      Uploading icon to S3...
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={2} alignItems="center">
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.primary">
                      Drag & drop an image here
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      or click to select a file
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported formats: JPG, PNG, GIF, SVG
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSubCategoryDialogOpen(false);
            clearSelectedIcon();
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedSubCategory ? handleUpdateSubCategory : handleCreateSubCategory}
            disabled={!subCategoryFormData.name.trim() || !subCategoryFormData.category_id}
          >
            {selectedSubCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plan Configuration Dialog */}
      <Dialog
        open={editPlanLimitsDialogOpen}
        onClose={() => setEditPlanLimitsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon />
            Edit {selectedPlan?.plan_name || 'Plan'} Configuration
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plan Name"
                  value={planFormData.plan_name || ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    plan_name: e.target.value
                  })}
                  disabled={!!selectedPlan}
                  helperText="Plan name cannot be changed"
                />
              </Grid> */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price (per month)"
                  type="number"
                  value={planFormData.price_cents ? (planFormData.price_cents / 100).toFixed(2) : ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    price_cents: Math.round(parseFloat(e.target.value || 0) * 100)
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={planFormData.description || ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    description: e.target.value
                  })}
                  placeholder="Brief description of this plan"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Custom Categories"
                  type="number"
                  value={planFormData.max_custom_categories === -1 ? '' : planFormData.max_custom_categories || ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    max_custom_categories: e.target.value === '' ? -1 : parseInt(e.target.value) || 0
                  })}
                  helperText="Leave empty for unlimited"
                />
              </Grid>
              {/* <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="POIs per Category (Deprecated)"
                  type="number"
                  disabled
                  value={planFormData.max_pois_per_category === -1 ? '' : planFormData.max_pois_per_category || ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    max_pois_per_category: e.target.value === '' ? -1 : parseInt(e.target.value) || 0
                  })}
                  helperText="No longer used - POI limits are now plan-based only"
                />
              </Grid> */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total POI Limit"
                  type="number"
                  value={planFormData.total_poi_limit === -1 ? '' : planFormData.total_poi_limit || ''}
                  onChange={(e) => setPlanFormData({
                    ...planFormData,
                    total_poi_limit: e.target.value === '' ? -1 : parseInt(e.target.value) || 0
                  })}
                  helperText="Leave empty for unlimited"
                />
              </Grid>
              {/* <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={planFormData.allow_custom_icons || false}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        allow_custom_icons: e.target.checked
                      })}
                    />
                  }
                  label="Allow Custom Icons"
                />
              </Grid> */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={planFormData.is_active !== false}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        is_active: e.target.checked
                      })}
                    />
                  }
                  label="Plan Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditPlanLimitsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdatePlan}
            disabled={!planFormData.plan_name?.trim()}
          >
            Update Plan Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
}

export default AdminDashboard;
