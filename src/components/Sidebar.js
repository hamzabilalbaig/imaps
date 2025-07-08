import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Clear as ClearIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  AddLocation as SuggestLocationIcon,
  Map as MapIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { CATEGORY_COLORS } from '../utils/mapUtils';
import { useCategories } from '../contexts/CategoriesContext';
import CategoryManager from './CategoryManager';
import { useAuth } from '../contexts/AuthContext';

/**
 * Left sidebar component matching GTA 5 map layout with category management
 */
function Sidebar({ 
  markers = [], 
  onMarkerClick, 
  onCategoryToggle, 
  visibleCategories = {}, 
  searchTerm = '', 
  onSearchChange,
  onShowAll,
  onHideAll,
  streetsVisible = true,
  onStreetsToggle
}) {
  const theme = useTheme();
  const { isAdmin } = useAuth();
  const { categories, getCategoryNames, getCategoryColors } = useCategories();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState(0); // 0 = Interactive Map, 1 = Categories

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Group markers by category
  const markersByCategory = markers.reduce((acc, marker) => {
    const category = marker.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(marker);
    return acc;
  }, {});

  // Filter markers based on search term
  const filteredMarkers = markers.filter(marker => 
    marker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marker.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleMarkerVisibilityToggle = (category) => {
    onCategoryToggle(category);
  };

  const getCategoryCount = (category) => {
    return markersByCategory[category]?.length || 0;
  };

  const getVisibleCount = (category) => {
    const categoryMarkers = markersByCategory[category] || [];
    return visibleCategories[category] ? categoryMarkers.length : 0;
  };

  return (
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
        {/* Tabs for admin users */}
        {isAdmin ? (
          <Box sx={{ mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                minHeight: 36,
                '& .MuiTab-root': {
                  minHeight: 36,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }
              }}
            >
              <Tab 
                icon={<MapIcon sx={{ fontSize: '1rem' }} />} 
                label="Interactive Map" 
                iconPosition="start"
              />
              <Tab 
                icon={<CategoryIcon sx={{ fontSize: '1rem' }} />} 
                label="Categories" 
                iconPosition="start"
              />
            </Tabs>
          </Box>
        ) : (
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: '1.2rem' }}>
            Interactive Map
          </Typography>
        )}
        
        {/* Interactive Map Content */}
        {(!isAdmin || activeTab === 0) && (
          <>
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange('')}>
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

            {/* Control Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button
                size="small"
                onClick={onShowAll}
                startIcon={<VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  },
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  px: 1.5,
                  py: 0.5
                }}
              >
                SHOW ALL
              </Button>
              <Button
                size="small"
                onClick={onHideAll}
                startIcon={<VisibilityOffIcon sx={{ fontSize: '0.9rem' }} />}
                sx={{ 
                  backgroundColor: theme.palette.grey[600],
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.grey[700]
                  },
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  px: 1.5,
                  py: 0.5
                }}
              >
                HIDE ALL
              </Button>
            </Box>

            {/* Streets Toggle */}
            <Button
              size="small"
              variant={streetsVisible ? "contained" : "outlined"}
              onClick={onStreetsToggle}
              sx={{ 
                mt: 1,
                width: '100%',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                py: 0.5,
                backgroundColor: streetsVisible ? theme.palette.success.main : 'transparent',
                color: streetsVisible ? 'white' : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: streetsVisible ? theme.palette.success.dark : alpha(theme.palette.success.main, 0.1)
                }
              }}
            >
              {streetsVisible ? '✓ STREETS' : 'STREETS'}
            </Button>
          </>
        )}
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Interactive Map Content */}
        {(!isAdmin || activeTab === 0) && (
          <>
            {/* Admin-Defined Categories */}
            <Box sx={{ px: 2, py: 1 }}>
              {getCategoryNames().length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: '1rem' }}>
                    No Categories Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 2 }}>
                    {isAdmin 
                      ? "Create categories in the Categories tab to organize your locations."
                      : "No location categories have been created yet. Please contact the administrator."
                    }
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setActiveTab(1)}
                      startIcon={<CategoryIcon />}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Go to Categories
                    </Button>
                  )}
                </Box>
              ) : (
                getCategoryNames().map((category) => {
                  const count = getCategoryCount(category);
                  const visibleCount = getVisibleCount(category);
                  const isVisible = visibleCategories[category];
                  const isExpanded = expandedCategories[category];
                  const categoryColors = getCategoryColors();
                  const categoryColor = categoryColors[category] || CATEGORY_COLORS['Other'];

                  if (count === 0) return null;

                  return (
                    <Accordion
                      key={category}
                      expanded={isExpanded}
                      onChange={() => handleCategoryToggle(category)}
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
                        expandIcon={count > 0 ? <ExpandMoreIcon sx={{ fontSize: '1rem', color: categoryColor }} /> : null}
                        sx={{
                          minHeight: 40,
                          px: 2,
                          '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                            margin: 0
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkerVisibilityToggle(category);
                            }}
                            sx={{ 
                              mr: 1.5,
                              color: isVisible ? categoryColor : theme.palette.grey[400],
                              '&:hover': {
                                backgroundColor: alpha(categoryColor, 0.1)
                              }
                            }}
                          >
                            {isVisible ? <VisibilityIcon sx={{ fontSize: '1rem' }} /> : <VisibilityOffIcon sx={{ fontSize: '1rem' }} />}
                          </IconButton>
                          
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
                          
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              flexGrow: 1,
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: theme.palette.text.primary
                            }}
                          >
                            {category}
                          </Typography>
                          
                          <Chip
                            label={count}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              backgroundColor: isVisible ? categoryColor : theme.palette.grey[300],
                              color: 'white',
                              '& .MuiChip-label': { px: 0.75 }
                            }}
                          />
                        </Box>
                      </AccordionSummary>
                      
                      {count > 0 && (
                        <AccordionDetails sx={{ pt: 0, px: 0 }}>
                          <List dense>
                            {(markersByCategory[category] || []).map((marker) => (
                              <ListItem key={marker.id} disablePadding>
                                <ListItemButton
                                  onClick={() => onMarkerClick(marker)}
                                  sx={{
                                    pl: 5,
                                    py: 0.5,
                                    '&:hover': {
                                      backgroundColor: alpha(categoryColor, 0.05)
                                    }
                                  }}
                                >
                                  <ListItemText
                                    primary={marker.title}
                                    secondary={marker.description}
                                    primaryTypographyProps={{
                                      fontSize: '0.8rem',
                                      fontWeight: 500
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: '0.7rem',
                                      sx: {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      )}
                    </Accordion>
                  );
                })
              )}
            </Box>
          </>
        )}

        {/* Category Manager for Admins */}
        {isAdmin && activeTab === 1 && (
          <CategoryManager />
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        {/* AD Area */}
        <Box sx={{ mb: 1, textAlign: 'center', minHeight: 180 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Ad Space
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;
