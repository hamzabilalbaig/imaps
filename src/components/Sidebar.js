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
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon
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
  onSearchChange
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

  useEffect(() => {
    // Initialize categories, subcategories, and POIs when component mounts
    initializeCategories();
    initializeSubCategories();
    initializePOIs();
  }, [initializeCategories, initializeSubCategories, initializePOIs]);

  // Filter categories based on search term
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleCategoryToggle = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
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
              const isExpanded = expandedCategories[category.id];
              const categoryColor = category.color || CATEGORY_COLORS[category.name] || CATEGORY_COLORS['Other'];
              const categorySubCategories = getSubCategoriesByCategoryId(category.id);

              return (
                <Accordion
                  key={category.id}
                  expanded={isExpanded}
                  onChange={() => handleCategoryToggle(category.id)}
                  sx={{
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0 },
                    mb: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(categoryColor, 0.2)}`,
                    '&:hover': {
                      backgroundColor: alpha(categoryColor, 0.02)
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem', color: categoryColor }} />}
                    sx={{
                      minHeight: 48,
                      px: 2,
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
                        {categorySubCategories.map((subCategory) => (
                          <Box
                            key={subCategory.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: alpha(categoryColor, 0.03),
                              border: `1px solid ${alpha(categoryColor, 0.1)}`,
                              cursor: 'pointer',
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
                                     borderRadius: 2
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
                                    justifyContent: 'center'
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
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {subCategory.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  color: theme.palette.text.secondary
                                }}
                              >
                                {getPOIsCountBySubCategory(subCategory.id)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
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
          {loading || subCategoriesLoading || poisLoading ? 'Loading...' : `${categories.length} categories, ${subCategories.length} subcategories, ${pois.length} POIs`}
        </Typography>
      </Box>
    </Box>
  );
}

export default Sidebar;
