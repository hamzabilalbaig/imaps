import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
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
  Divider,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar
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
  PushPin as PushPinIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  AttachMoney as PricingIcon
} from '@mui/icons-material';
import { localDB } from '../utils/localStorage';
import useUserStore from '../stores/user';
import { useNavigate } from 'react-router-dom';
import LoginDialog from './LoginDialog';

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
  userMarkerCount = 0,
  userCategoryCount = 0,
  maxMarkers = Infinity,
  canCreateMore = true,
  onFoundLocationClick,
  showLoginDialog = false, // New prop to control login dialog from parent
  onLoginDialogClose // New prop to handle login dialog close
}) {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getRemainingCategories, canUseCustomIcons, id, name, email, plan, role, initializeUser, planLimits, logout, isUserAdmin } = useUserStore();
  const navigate = useNavigate();
  
  // Authentication state and handlers
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isAdmin = isUserAdmin();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  // Use isLoggedIn state and update when user.id changes
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  React.useEffect(() => {
    setIsLoggedIn(id !== null);
  }, [id]);
  
  // Local state for login dialog
  const [localLoginDialogOpen, setLocalLoginDialogOpen] = useState(false);
  
  // Use either the parent-controlled login dialog or local state
  const setShowLoginDialog = (open) => {
    if (onLoginDialogClose) {
      // If parent handles login dialog, use parent's state
      if (open) {
        // Parent should handle opening, but we can't trigger it directly
        // This will be handled by the parent through map click interception
      } else {
        onLoginDialogClose();
      }
    } else {
      // Use local state if no parent handler
      setLocalLoginDialogOpen(open);
    }
  };
  
  const isLoginDialogOpen = showLoginDialog || localLoginDialogOpen;
  
  useEffect(() => {
    const initializeData = async () => {
      await initializeUser();
    };
    initializeData();
  }, []); // Only run once on mount

  const user = { id, name, email, plan, role };
  
  // Get current category count from localStorage
  // const currentCategoryCount = user ? (user.usercategories?.length || 0) : 0;
  const currentCategoryCount = user?.role === 'admin' ? JSON.parse(localStorage.getItem('imaps_admin_categories') || '[]').length : user?.role === 'user' ? userCategoryCount : 0;
  const remainingCategories = user ? getRemainingCategories(currentCategoryCount) : 0;
  
  // Calculate note limits
  const currentNoteCount = notes?.length || 0;
  const currentUserPlan = plan || 'free';
  // Use storePlanLimits loaded from user store, fallback to free if not yet loaded
  // Provide default note limits while loading planLimits
  const defaultNoteLimits = { free: 5, premium: 50, unlimited: Infinity };
  const limits = planLimits && planLimits[currentUserPlan]
    ? planLimits[currentUserPlan]
    : { maxNotes: defaultNoteLimits[currentUserPlan] ?? defaultNoteLimits.free };
  const maxNotes = limits.maxNotes;
  const remainingNotes = maxNotes === Infinity ? '∞' : Math.max(0, maxNotes - currentNoteCount);
  const canCreateMoreNotes = role === 'admin' || maxNotes === Infinity || currentNoteCount < maxNotes;
  
  const progress = maxMarkers === Infinity ? 100 : (userMarkerCount / maxMarkers) * 100;
  const remainingPOIs = maxMarkers === Infinity ? '∞' : Math.max(0, maxMarkers - userMarkerCount);
  // Compute My POI creation allowance locally (separate from suggestion allowance)
  const canCreateMorePOIs = isAdmin || maxMarkers === Infinity || userMarkerCount < maxMarkers;
  
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
        borderRadius: 0,
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

      {/* Navigation & Authentication Section */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        gap: { xs: 0.5, md: 0.5 }, 
        alignItems: 'center', 
        // flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Public View Button - Always show except on home page */}
        {location.pathname !== '/' && (
          <Button
            component={Link}
            to={isLoggedIn ? "/map" : "/"}
            color="inherit"
            variant={location.pathname === "/" || location.pathname === "/map" ? "contained" : "text"}
            sx={{
              backgroundColor: location.pathname === "/" || location.pathname === "/map" ? "rgba(255,255,255,0.2)" : "transparent",
              borderRadius: 2,
              px: { xs: 1, sm: 2, md: 3 },
              py: 1,
              fontWeight: 600,
              // fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
              backdropFilter: location.pathname === "/" || location.pathname === "/map" ? 'blur(10px)' : 'none',
              border: location.pathname === "/" || location.pathname.includes("/map") || location.pathname.includes("/admin-map") ? '1px solid #1d4ed8' : '1px solid transparent',
              '&:hover': {
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }
            }}
            startIcon={!isMobile ? <PublicIcon /> : null}
          >
            {isMobile ? "Public" : "Public View"}
          </Button>
        )}

        {/* Show Admin Panel for admins, Pricing for regular users - only when authenticated */}
        {isLoggedIn && (isAdmin ? (
          <Button
            component={Link}
            to="/admin"
            color="inherit"
            variant={location.pathname === "/admin" ? "contained" : "text"}
            sx={{
              backgroundColor: location.pathname === "/admin" ? "rgba(255,255,255,0.2)" : "transparent",
              borderRadius: 2,
              px: { xs: 1, sm: 2, md: 3 },
              py: 1,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
              backdropFilter: location.pathname === "/admin" ? 'blur(10px)' : 'none',
              border: location.pathname === "/admin" ? '1px solid' : '1px solid transparent',
              '&:hover': {
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }
            }}
            startIcon={!isMobile ? <SettingsIcon /> : null}
          >
            {isMobile ? "Admin" : "Admin Panel"}
          </Button>
        ) : (
          <Button
            component={Link}
            to="/pricing"
            color="inherit"
            variant={location.pathname === "/pricing" ? "contained" : "text"}
            sx={{
              backgroundColor: location.pathname === "/pricing" ? "rgba(255,255,255,0.2)" : "transparent",
              borderRadius: 2,
              px: { xs: 1, sm: 2, md: 3 },
              py: 1,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
              backdropFilter: location.pathname === "/pricing" ? 'blur(10px)' : 'none',
              border: location.pathname === "/pricing" ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              '&:hover': {
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }
            }}
            startIcon={!isMobile ? <PricingIcon /> : null}
          >
            {isMobile ? "Pricing" : "Pricing"}
          </Button>
        ))}

        {/* Authentication buttons for non-authenticated users */}
        {!isLoggedIn && (
          <>
            <Button
              component={Link}
              to="/login"
              color="inherit"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                borderRadius: 2,
                px: { xs: 1.5, sm: 2, md: 3 },
                py: 1,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                '&:hover': {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderColor: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)'
                }
              }}
              startIcon={!isMobile ? <PersonIcon /> : null}
            >
              Login
            </Button>
            <Button
              component={Link}
              to="/register"
              color="inherit"
              variant="contained"
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                px: { xs: 1.5, sm: 2, md: 3 },
                py: 1,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: "rgba(255,255,255,0.3)",
                  border: '1px solid rgba(255,255,255,0.5)'
                }
              }}
              startIcon={!isMobile ? <PersonAddIcon /> : null}
            >
              Register
            </Button>
          </>
        )}

        {/* User Menu */}
        {isLoggedIn && (
          <>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
              sx={{
                ml: 1,
                '&:hover': {
                  backgroundColor: "rgba(255,255,255,0.2)",
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem'
                }}
              >
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Chip 
                  label={user.plan || 'Free'} 
                  size="small" 
                  color={user.role === 'admin' ? 'error' : 'primary'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
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
          
          {/* Suggest Location Button - Always available */}
          {(user ? canCreateMore : true) && (
            <Button
              variant={isSuggestMode ? "contained" : "outlined"}
              startIcon={<LocationSearchingIcon />}
              onClick={user ? onSuggestLocation : () => setShowLoginDialog(true)}
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
          )}
          
          {/* Add Note Button - Always available */}
          {(user ? canCreateMoreNotes : true) && (
            <Button
              variant={isNoteMode ? "contained" : "outlined"}
              startIcon={<AddIcon />}
              onClick={user ? onAddNote : () => setShowLoginDialog(true)}
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

          {/* Add POI Button - Always available, hidden for admins */}
          {!isAdmin && (user ? canCreateMorePOIs : true) && (
            <Button
              variant={isPOIMode ? "contained" : "outlined"}
              startIcon={<PushPinIcon />}
              onClick={user ? onAddPOI : () => setShowLoginDialog(true)}
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

          <Typography variant="subtitle2" sx={{ 
            mb: 1,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
            letterSpacing: 1
          }}>
            NOTES ({currentNoteCount}/{maxNotes === Infinity ? '∞' : maxNotes})
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

  {id && !isAdmin && (
          <>
            <Divider />

            {/* POI Usage Stats - Only show for logged-in non-admin users */}
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
                {/* {canUseCustomIcons() && (
                  <Chip 
                    label="CUSTOM ICONS"
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )} */}
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
                  UPGRADE TO UNLIMITED
                </Button>
              )}
            </Box>
          </>
        )}

        
      </Box>
      
      {/* Login Dialog for non-logged-in users */}
      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setShowLoginDialog(false)}
        onSuccess={() => {
          // Close dialog and optionally refresh user data after successful login
          setShowLoginDialog(false);
        }}
      />
    </Paper>
  );
}

export default ProgressTracker;
