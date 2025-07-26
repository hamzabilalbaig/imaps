import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Chip,
  List,
  ListItem,
  Alert,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { generateShareableLink } from "../utils/mapUtils";
import { useCategories } from '../contexts/CategoriesContext';

/**
 * Component for listing and managing POIs in admin panel
 */
function POIList({ markers, onEdit, onRemove, onClearAll }) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { getCategoryNames } = useCategories();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const filteredMarkers = markers?.filter(marker => {
    const matchesCategory = filterCategory === "All" || marker.category === filterCategory;
    const matchesSearch = !searchTerm || 
      marker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marker.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleShare = async (marker) => {
    const shareableLink = generateShareableLink(marker);
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert("Shareable link copied to clipboard!");
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Shareable link copied to clipboard!");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Restaurant": "error",
      "Tourist Attraction": "primary",
      "Hotel": "secondary",
      "Shopping": "success",
      "Transportation": "warning",
      "Healthcare": "error",
      "Education": "info",
      "Entertainment": "warning",
      "Other": "default"
    };
    return colors[category] || "default";
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: { xs: '100%', lg: 380, xl: 420 }, 
        minWidth: { lg: 380 },
        borderRight: { lg: 1 }, 
        borderColor: 'grey.200', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
      }}
    >
      <Box sx={{ 
        p: { xs: 2, md: 3 }, 
        borderBottom: 1, 
        borderColor: 'grey.200',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: { xs: 2, md: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
            <Paper
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
              <SearchIcon sx={{ color: 'white', fontSize: { xs: 16, md: 20 } }} />
            </Paper>
            <Box sx={{ flex: { xs: 1, sm: 'none' } }}>
              <Typography variant="h6" component="h2" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Locations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                {markers.length} item{markers.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={onClearAll}
            disabled={markers.length === 0}
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ClearIcon />}
            sx={{
              borderRadius: 2,
              px: { xs: 1.5, md: 2 },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              fontWeight: 500,
              border: '1px solid',
              borderColor: 'error.300',
              '&:hover': {
                borderColor: 'error.400',
                backgroundColor: 'error.50'
              }
            }}
          >
            Clear All
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'grey.500', mr: 1, fontSize: { xs: 16, md: 20 } }} />
          }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'white',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }
          }}
        />

        {/* Category Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            label="Filter by Category"
            onChange={(e) => setFilterCategory(e.target.value)}
            sx={{
              borderRadius: 2,
              backgroundColor: 'white',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {getCategoryNames().map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: { xs: 1, md: 2 },
        minHeight: 0 // Allow flex shrinking
      }}>
        {filteredMarkers.length === 0 ? (
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'grey.300',
              backgroundColor: 'grey.50'
            }}
          >
            <SearchIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              {markers.length === 0 ? "No locations yet" : "No matches found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              {markers.length === 0 
                ? "Click on the map to add your first location"
                : "Try adjusting your search or filter criteria"}
            </Typography>
          </Paper>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredMarkers.map((marker, index) => (
              <ListItem key={marker.id} sx={{ p: 0, mb: { xs: 1.5, md: 2 } }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    width: '100%',
                    borderRadius: { xs: 2, md: 3 },
                    border: '1px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: 'primary.200',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 }, '&:last-child': { pb: { xs: 1.5, md: 2.5 } } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between', 
                      mb: 1.5,
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ 
                        flex: 1, 
                        mr: { sm: 1 },
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }}>
                        {marker.title || "Untitled Location"}
                      </Typography>
                      <Chip 
                        label={marker.category} 
                        color={getCategoryColor(marker.category)}
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          borderRadius: 1.5,
                          fontSize: { xs: '0.65rem', md: '0.75rem' }
                        }}
                      />
                    </Box>

                    {marker.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: { xs: 2, md: 3 },
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 1.5,
                          lineHeight: 1.4,
                          fontSize: { xs: '0.75rem', md: '0.875rem' }
                        }}
                      >
                        {marker.description}
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ 
                      mb: 2, 
                      display: 'block',
                      fontSize: { xs: '0.65rem', md: '0.75rem' }
                    }}>
                      📍 {marker.coords}
                    </Typography>

                    <ButtonGroup 
                      fullWidth 
                      size="small" 
                      variant="outlined"
                      orientation={isMobile ? 'vertical' : 'horizontal'}
                      sx={{
                        '& .MuiButton-root': {
                          borderRadius: '6px',
                          fontSize: { xs: '0.65rem', md: '0.75rem' },
                          fontWeight: 500,
                          textTransform: 'none',
                          py: { xs: 0.75, md: 1 }
                        },
                        '& .MuiButton-root + .MuiButton-root': {
                          marginLeft: isMobile ? 0 : '8px',
                          marginTop: isMobile ? '8px' : 0
                        }
                      }}
                    >
                      <Button
                        onClick={() => handleShare(marker)}
                        startIcon={<ShareIcon />}
                        sx={{ 
                          borderColor: 'primary.200',
                          color: 'primary.600',
                          '&:hover': {
                            borderColor: 'primary.400',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        Share
                      </Button>
                      <Button
                        onClick={() => onEdit(marker)}
                        startIcon={<EditIcon />}
                        sx={{ 
                          borderColor: 'success.200',
                          color: 'success.600',
                          '&:hover': {
                            borderColor: 'success.400',
                            backgroundColor: 'success.50'
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onRemove(marker.id)}
                        startIcon={<DeleteIcon />}
                        sx={{ 
                          borderColor: 'error.200',
                          color: 'error.600',
                          '&:hover': {
                            borderColor: 'error.400',
                            backgroundColor: 'error.50'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}

export default POIList;
