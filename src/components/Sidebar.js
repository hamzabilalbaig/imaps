import React, { useEffect, useState } from 'react';
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
  alpha,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  ButtonGroup
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { CATEGORY_COLORS } from '../utils/mapUtils';
import useCategoriesStore from '../stores/categories';
import useSubCategoriesStore from '../stores/subCategories';
import usePOIsStore from '../stores/pois';

/**
 * Simple sidebar component displaying categories
 */
function Sidebar({ 
  searchTerm = '', 
  onSearchChange,
  onVisibilityChange
}) {
  const theme = useTheme();
  
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
    getSubCategoriesByCategoryId 
  } = useSubCategoriesStore();

  // POIs store
  const { 
    pois,
    loading: poisLoading, 
    error: poisError, 
    initializePOIs,
    getPOIsCountBySubCategory 
  } = usePOIsStore();

  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Visibility state management
  const [globalVisibility, setGlobalVisibility] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [hiddenSubCategories, setHiddenSubCategories] = useState(new Set());

  useEffect(() => {
    // Initialize categories, subcategories, and POIs when component mounts
    initializeCategories();
    initializeSubCategories();
    initializePOIs();
    
    // Set all categories as expanded by default (non-collapsible)
    if (categories.length > 0) {
      const allExpanded = {};
      categories.forEach(category => {
        allExpanded[category.id] = true;
      });
      setExpandedCategories(allExpanded);
    }
  }, [initializeCategories, initializeSubCategories, initializePOIs, categories]);

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
  };  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        borderRight: `1px solid ${theme.palette.divider}`,
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
            <Typography variant="caption" sx={{ mb: 2, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
              {filteredCategories.length} Categories
            </Typography>
            
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
                                backgroundColor: alpha(categoryColor, 0.03),
                                border: `1px solid ${alpha(categoryColor, 0.1)}`,
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
                              <Box sx={{ flex: 1, minWidth: 0 }}>
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
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {loading || subCategoriesLoading || poisLoading ? 'Loading...' : 
            `${categories.length} categories, ${subCategories.length} subcategories, ${pois.length} POIs`
          }
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
          Hidden: {hiddenCategories.size} categories, {hiddenSubCategories.size} subcategories
        </Typography>
      </Box>
    </Box>
  );
}

export default Sidebar;
