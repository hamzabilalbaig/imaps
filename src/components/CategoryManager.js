import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/mapUtils';
import { useCategories } from '../contexts/CategoriesContext';
import IconSelector from './IconSelector';
import ColorPicker from './ColorPicker';

// Storage key for custom categories
const CATEGORIES_STORAGE_KEY = 'customCategories';

/**
 * Admin component for managing POI categories
 */
function CategoryManager() {
  const theme = useTheme();
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    selectedIcon: null,
    customIcon: null,
    color: CATEGORY_COLORS['Other'] || '#6b7280',
    description: ''
  });
  const [customIcons, setCustomIcons] = useState([]);

  // Load custom icons on component mount
  useEffect(() => {
    loadCustomIcons();
  }, []);

  const loadCustomIcons = () => {
    try {
      const saved = localStorage.getItem('customIcons');
      if (saved) {
        setCustomIcons(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom icons:', error);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      selectedIcon: null,
      customIcon: null,
      color: CATEGORY_COLORS['Other'] || '#6b7280',
      description: ''
    });
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      selectedIcon: category.selectedIcon || null,
      customIcon: category.customIcon || null,
      color: category.color,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        deleteCategory(categoryId);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    // Check for duplicate names (excluding current edit)
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      cat.id !== editingCategory?.id
    );

    if (isDuplicate) {
      alert('A category with this name already exists');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          selectedIcon: formData.selectedIcon,
          customIcon: formData.customIcon,
          color: formData.color,
          description: formData.description.trim()
        });
      } else {
        // Add new category
        addCategory({
          name: formData.name.trim(),
          selectedIcon: formData.selectedIcon,
          customIcon: formData.customIcon,
          color: formData.color,
          description: formData.description.trim()
        });
      }

      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      alert('Error saving category: ' + error.message);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      selectedIcon: null,
      customIcon: null,
      color: CATEGORY_COLORS['Other'] || '#6b7280',
      description: ''
    });
  };

  const handleIconSelect = (iconKey, customIconData = null) => {
    setFormData(prev => ({
      ...prev,
      selectedIcon: iconKey,
      customIcon: customIconData
    }));

    // If it's a new custom icon, update the custom icons list
    if (customIconData) {
      setCustomIcons((prev) => {
        const exists = prev.find((icon) => icon.id === customIconData.id);
        if (!exists) {
          const updatedIcons = [...prev, customIconData];
          localStorage.setItem('customIcons', JSON.stringify(updatedIcons));
          return updatedIcons;
        }
        return prev;
      });
    }
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
  };

  const renderCategoryIcon = (category, iconProps = {}) => {
    const iconSize = iconProps.fontSize === '1rem' ? 16 : 24;
    
    // Check if it's a custom uploaded icon
    if (category.customIcon) {
      return (
        <img 
          src={category.customIcon.data} 
          alt={category.customIcon.name}
          style={{ width: iconSize, height: iconSize, objectFit: 'contain' }}
        />
      );
    }
    
    // Check if it's a custom icon from localStorage
    if (category.selectedIcon && category.selectedIcon.startsWith('custom_')) {
      const customIcon = customIcons.find(icon => icon.id === category.selectedIcon);
      if (customIcon) {
        return (
          <img 
            src={customIcon.data} 
            alt={customIcon.name}
            style={{ width: iconSize, height: iconSize, objectFit: 'contain' }}
          />
        );
      }
    }
    
    // Check if it's a built-in icon
    if (category.selectedIcon && CATEGORY_ICONS[category.selectedIcon]) {
      const IconComponent = CATEGORY_ICONS[category.selectedIcon];
      return <IconComponent size={iconSize} style={{ color: 'white' }} />;
    }
    
    // Fallback
    return (
      <Box 
        sx={{ 
          width: iconSize, 
          height: iconSize, 
          backgroundColor: category.color, 
          borderRadius: 1 
        }} 
      />
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Compact Header for Sidebar */}
      <Box sx={{ 
        p: 1.5, 
        borderBottom: 1, 
        borderColor: 'grey.200'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 1
        }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              onClick={handleAddCategory}
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: '0.875rem' }} />}
              sx={{
                borderRadius: 1.5,
                px: 1,
                fontSize: '0.65rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
          Manage categories that users select when creating locations.
        </Typography>
      </Box>

      {/* Compact Categories List */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        px: 1.5,
        py: 1,
        minHeight: 0
      }}>
        {categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CategoryIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
              No categories yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 2, display: 'block' }}>
              Create your first category
            </Typography>
            <Button
              onClick={handleAddCategory}
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              sx={{ fontSize: '0.65rem' }}
            >
              Add First Category
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {categories.map((category, index) => (
              <ListItem 
                key={category.id} 
                sx={{ 
                  p: 0, 
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                <Card 
                  variant="outlined" 
                  sx={{ 
                    width: '100%',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      borderColor: 'primary.200',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 1
                    }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          backgroundColor: alpha(category.color, 0.15),
                          border: `1.5px solid ${category.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {renderCategoryIcon(category, { fontSize: '1rem' })}
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={600} 
                          sx={{ 
                            fontSize: '0.75rem',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {category.name}
                        </Typography>
                        {category.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: '0.65rem',
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.25
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                      <Button
                        onClick={() => handleEditCategory(category)}
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: '0.75rem' }} />}
                        sx={{
                          borderRadius: 1,
                          px: 1,
                          fontSize: '0.6rem',
                          fontWeight: 500,
                          borderColor: 'primary.200',
                          color: 'primary.600',
                          minWidth: 'auto',
                          width: "100%",
                          '&:hover': {
                            borderColor: 'primary.400',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category.id)}
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon sx={{ fontSize: '0.75rem' }} />}
                        sx={{
                          borderRadius: 1,
                          px: 1,
                          fontSize: '0.6rem',
                          fontWeight: 500,
                          borderColor: 'error.200',
                          color: 'error.600',
                          minWidth: 'auto',
                          width: "100%",
                          '&:hover': {
                            borderColor: 'error.400',
                            backgroundColor: 'error.50'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Add/Edit Category Form Dialog */}
      <Dialog 
        open={showForm} 
        onClose={handleCancelForm} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSaveCategory
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: '1px solid',
          borderColor: 'grey.100',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: 2,
                p: 1,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CategoryIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" component="h2" fontWeight={600}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              placeholder="Enter category name (e.g., Coffee Shops, Museums)"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Describe what this category is for"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Customize Appearance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <IconSelector
                  selectedIcon={formData.selectedIcon}
                  onIconSelect={handleIconSelect}
                  customIcons={customIcons}
                />
                <ColorPicker
                  selectedColor={formData.color}
                  onColorChange={handleColorChange}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'grey.100',
          backgroundColor: 'grey.50'
        }}>
          <Button 
            onClick={handleCancelForm} 
            startIcon={<CancelIcon />}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ 
              borderRadius: 2,
              ml: 1,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            }}
          >
            {editingCategory ? 'Update Category' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CategoryManager;
