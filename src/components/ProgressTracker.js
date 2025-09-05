import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Button,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Expand as ExpandIcon,
  Upgrade as UpgradeIcon,
  LocationSearching as LocationSearchingIcon,
  PushPin as PushPinIcon
} from '@mui/icons-material';
import { localDB } from '../utils/localStorage';
import useUserStore, { PLAN_LIMITS } from '../stores/user';
import { useNavigate } from 'react-router-dom';

function ProgressTracker({ 
  // user, 
  markers = [],
  categories = [],
  foundLocations = [], 
  onClose,
  onAddNote,
  onEditNote,
  onRemoveNote,
  notes = [],
  isMinimized = false,
  onToggleMinimize,
  onSuggestLocation,
  isSuggestMode = false,
  isNoteMode = false,
  onAddPOI,
  isPOIMode = false,
  readOnly = false,
  isAdmin = false,
  userMarkerCount = 0,
  userCategoryCount = 0,
  maxMarkers = Infinity,
  canCreateMore = true,
  onFoundLocationClick
}) {
  const theme = useTheme();
  const { getRemainingCategories, canUseCustomIcons, id, name, email, plan, role, initializeUser } = useUserStore();
  const navigate = useNavigate();
  useEffect(() => {
    initializeUser();
  }, []); // Only run once on mount

  const user = { id, name, email, plan, role };
  
  // Get current category count from localStorage
  // const currentCategoryCount = user ? (user.usercategories?.length || 0) : 0;
  const currentCategoryCount = user?.role === 'admin' ? JSON.parse(localStorage.getItem('imaps_admin_categories') || '[]').length : user?.role === 'user' ? userCategoryCount : 0;
  const remainingCategories = user ? getRemainingCategories(currentCategoryCount) : 0;
  
  // Calculate note limits
  const currentNoteCount = notes?.length || 0;
  const currentUserPlan = user?.plan || 'free';
  const planLimits = PLAN_LIMITS[currentUserPlan] || PLAN_LIMITS.free;
  const maxNotes = planLimits.maxNotes || 0;
  const remainingNotes = maxNotes === Infinity ? '∞' : Math.max(0, maxNotes - currentNoteCount);
  const canCreateMoreNotes = user?.role === 'admin' || maxNotes === Infinity || currentNoteCount < maxNotes;
  
  const progress = maxMarkers === Infinity ? 100 : (userMarkerCount / maxMarkers) * 100;
  const remainingPOIs = maxMarkers === Infinity ? '∞' : Math.max(0, maxMarkers - userMarkerCount);
  
  if (isMinimized) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          width: '100%'
        }}
      >
        <IconButton size="small" onClick={onToggleMinimize}>
          <ExpandIcon />
        </IconButton>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: alpha(theme.palette.background.paper, 0.98),
        backdropFilter: 'blur(12px)',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ 
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontSize: '1rem'
        }}>
          PROGRESS TRACKER
        </Typography>
        <Box>
          {/* <IconButton size="small" onClick={onToggleMinimize}>
            <MinimizeIcon />
          </IconButton> */}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* User Info & Progress */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
            letterSpacing: 1,
            fontSize: '0.75rem'
          }}>
            ACTIONS
          </Typography>
          
          {user ? (
            <>
              {canCreateMore ? (
                <Button
                  variant={isSuggestMode ? "contained" : "outlined"}
                  startIcon={<LocationSearchingIcon />}
                  onClick={onSuggestLocation}
                  fullWidth
                  sx={{ 
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: isSuggestMode ? theme.palette.primary.main : 'transparent',
                    color: isSuggestMode ? 'white' : theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: isSuggestMode ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  {isSuggestMode 
                    ? (isAdmin ? 'Cancel Add' : 'Cancel Suggest') 
                    : (isAdmin ? 'Add Location' : 'Suggest Location')
                  }
                </Button>
              ) : (
                // <Typography variant="caption" color="error" sx={{ 
                //   display: 'block',
                //   textAlign: 'center',
                //   fontSize: '0.7rem',
                //   fontStyle: 'italic',
                //   mb: 1
                // }}>
                //   POI limit reached. Upgrade to add more.
                // </Typography>
                <></>
              )}
              
              {canCreateMoreNotes && (
                <Button
                  variant={isNoteMode ? "contained" : "outlined"}
                  startIcon={<AddIcon />}
                  onClick={onAddNote}
                  fullWidth
                  sx={{ 
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: isNoteMode ? theme.palette.secondary.main : 'transparent',
                    color: isNoteMode ? 'white' : theme.palette.secondary.main,
                    borderColor: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: isNoteMode ? theme.palette.secondary.dark : alpha(theme.palette.secondary.main, 0.1),
                      borderColor: theme.palette.secondary.main
                    }
                  }}
                >
                  {isNoteMode ? 'Cancel Note' : 'Add Note'}
                </Button>
              )}

              {!isAdmin && (
                <Button
                  variant={isPOIMode ? "contained" : "outlined"}
                  startIcon={<PushPinIcon />}
                  onClick={onAddPOI}
                  fullWidth
                  sx={{ 
                    mb: 2,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: isPOIMode ? theme.palette.warning.main : 'transparent',
                    color: isPOIMode ? 'white' : theme.palette.warning.main,
                    borderColor: theme.palette.warning.main,
                    '&:hover': {
                      backgroundColor: isPOIMode ? theme.palette.warning.dark : alpha(theme.palette.warning.main, 0.1),
                      borderColor: theme.palette.warning.main
                    }
                  }}
                >
                  {isPOIMode ? 'Cancel POI' : 'Add POI'}
                </Button>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Sign in to suggest locations, add notes, and track your progress.
              </Typography>
              <Button
                component="a"
                href="/login"
                variant="contained"
                fullWidth
                sx={{
                  mb: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                Sign In to Contribute
              </Button>
              <Button
                component="a"
                href="/register"
                variant="outlined"
                fullWidth
                sx={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                Create Account
              </Button>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ 
            mb: 1,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
            letterSpacing: 1
          }}>
            NOTES ({notes.length}{user?.role !== 'admin' ? `/${maxNotes === Infinity ? '∞' : maxNotes}` : ''})
          </Typography>
          
          {notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontStyle: 'italic',
              fontSize: '0.8rem',
              textAlign: 'center',
              py: 2
            }}>
              {isPOIMode 
                ? "Click anywhere on the map to add a new POI."
                : (isNoteMode 
                    ? "Click anywhere on the map to add a new note."
                    : (isSuggestMode 
                        ? (isAdmin 
                            ? "Click anywhere on the map to add a new location." 
                            : "Click anywhere on the map to suggest a new location.")
                        : (user?.role === 'admin' 
                            ? "No notes yet. Click 'Add Note' to get started."
                            : `No notes yet. Click 'Add Note' to get started.`)
                      )
                  )
              }
            </Typography>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {notes?.map((note) => (
                <ListItem 
                  key={note.id} 
                  sx={{ 
                    px: 0,
                    py: 0.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05)
                    }
                  }}
                  onClick={() => onEditNote && onEditNote(note)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <NotesIcon sx={{ fontSize: '1rem', color: theme.palette.secondary.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={note.title}
                    secondary={note.description || note.coords}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        {/* Found Locations - Only show for non-admin users */}
        {!isAdmin && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: theme.palette.text.secondary,
              letterSpacing: 1
            }}>
              FOUND LOCATIONS ({foundLocations.length})
            </Typography>
            
            {foundLocations.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontStyle: 'italic',
                fontSize: '0.8rem',
                textAlign: 'center',
                py: 2
              }}>
                No locations found yet.
              </Typography>
            ) : (
              <List dense>
                {foundLocations.map((location, index) => {
                // Parse coordinates from found location
                const handleLocationClick = () => {
                  if (onFoundLocationClick && location.coords) {
                    // Parse coordinates - they could be array or string
                    let lat, lng;
                    if (Array.isArray(location.coords)) {
                      lat = location.coords[0];
                      lng = location.coords[1];
                    } else if (typeof location.coords === 'string') {
                      const coords = location.coords.split(',').map(coord => parseFloat(coord.trim()));
                      lat = coords[0];
                      lng = coords[1];
                    }
                    
                    if (lat !== undefined && lng !== undefined) {
                      onFoundLocationClick({
                        lat,
                        lng,
                        poi: location // Pass the full location data with POI info
                      });
                    }
                  }
                };

                return (
                  <ListItem 
                    key={location.id || index} 
                    sx={{ 
                      px: 0,
                      py: 0.5,
                      cursor: onFoundLocationClick ? 'pointer' : 'default',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: onFoundLocationClick ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                      }
                    }}
                    onClick={handleLocationClick}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LocationOnIcon sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={location.name}
                      secondary={`${location.subcategory_name || 'Unknown Category'} • Found ${new Date(location.found_at).toLocaleDateString()}`}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.7rem'
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
          </Box>
        )}

        {user && !isAdmin && (
          <>
            <Divider />

            {/* POI Usage Stats */}
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: theme.palette.text.secondary,
                letterSpacing: 1
              }}>
                YOUR USAGE STATS
              </Typography>
              
              {/* Category Usage */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Custom Categories
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {currentCategoryCount} / {remainingCategories === Infinity ? '∞' : (currentCategoryCount + remainingCategories)}
                  </Typography>
                </Box>
                {remainingCategories !== Infinity && (
                  <LinearProgress 
                    variant="determinate" 
                    value={remainingCategories === 0 ? 100 : (currentCategoryCount / (currentCategoryCount + remainingCategories)) * 100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: theme.palette.secondary.main
                      }
                    }}
                  />
                )}
              </Box>

              {/* POI Usage */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Total POIs
                  </Typography>
                  {
                    user?.role === 'admin' ?
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {userMarkerCount} / ∞ 
                    </Typography>
                     :
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {userMarkerCount} / {maxMarkers === Infinity ? '∞' : maxMarkers}
                  </Typography>
}
                </Box>
                {maxMarkers !== Infinity && (
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: progress >= 80 ? 
                          theme.palette.warning.main : 
                          theme.palette.primary.main
                      }
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={`${remainingCategories === Infinity ? '∞' : remainingCategories} categories left`}
                  size="small"
                  color={remainingCategories === 0 ? "error" : "secondary"}
                  sx={{ fontSize: '0.7rem' }}
                />
                <Chip 
                  label={`${remainingPOIs} remaining`}
                  size="small"
                  color={remainingPOIs === 0 ? "error" : "primary"}
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={user?.plan?.toUpperCase() || 'FREE'}
                  size="small"
                  color="info"
                  sx={{ fontSize: '0.7rem' }}
                />
                {canUseCustomIcons() && (
                  <Chip 
                    label="CUSTOM ICONS"
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              {user?.plan !== 'unlimited' && (
                <Button
                  variant="contained"
                  startIcon={<UpgradeIcon />}
                  fullWidth
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark
                    },
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                  onClick={()=> navigate('/pricing')}
                >
                  UPGRADE TO PRO
                </Button>
              )}
            </Box>
          </>
        )}

        
      </Box>
    </Paper>
  );
}

export default ProgressTracker;
