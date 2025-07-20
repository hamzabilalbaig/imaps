import React, { useState } from 'react';
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
  LocationSearching as LocationSearchingIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function ProgressTracker({ 
  user, 
  userMarkerCount, 
  maxMarkers,
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
  canCreateMore = true,
  isAdmin = false
}) {
  const theme = useTheme();
  const { getRemainingCategories, canUseCustomIcons } = useAuth();
  
  // Get current category count from localStorage
  const currentCategoryCount = user ? (user.userCategories?.length || 0) : 0;
  const remainingCategories = user ? getRemainingCategories(currentCategoryCount) : 0;
  
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
          
          <Button
            variant={isSuggestMode ? "contained" : "outlined"}
            startIcon={<LocationSearchingIcon />}
            onClick={onSuggestLocation}
            fullWidth
            disabled={!canCreateMore}
            sx={{ 
              mb: 1,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: isSuggestMode ? theme.palette.primary.main : 'transparent',
              color: isSuggestMode ? 'white' : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: isSuggestMode ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.1)
              },
              '&:disabled': {
                backgroundColor: 'grey.200',
                color: 'grey.400'
              }
            }}
          >
            {isSuggestMode 
              ? (isAdmin ? 'Cancel Add' : 'Cancel Suggest') 
              : (isAdmin ? 'Add Location' : 'Suggest Location')
            }
          </Button>
          
          {!canCreateMore && (
            <Typography variant="caption" color="error" sx={{ 
              display: 'block',
              textAlign: 'center',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              mb: 1
            }}>
              POI limit reached. Upgrade to add more.
            </Typography>
          )}
          
          <Button
            variant={isNoteMode ? "contained" : "outlined"}
            startIcon={<AddIcon />}
            onClick={onAddNote}
            fullWidth
            sx={{ 
              mb: 2,
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

          <Typography variant="subtitle2" sx={{ 
            mb: 1,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
            letterSpacing: 1
          }}>
            NOTES ({notes.length})
          </Typography>
          
          {notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontStyle: 'italic',
              fontSize: '0.8rem',
              textAlign: 'center',
              py: 2
            }}>
              {isNoteMode 
                ? "Click anywhere on the map to add a new note."
                : (isSuggestMode 
                    ? (isAdmin 
                        ? "Click anywhere on the map to add a new location." 
                        : "Click anywhere on the map to suggest a new location.")
                    : "No notes yet. Click 'Add Note' to get started."
                  )
              }
            </Typography>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {notes.map((note) => (
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

        {/* Found Locations */}
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
              {foundLocations.map((location, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    px: 0,
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.main, 0.05)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <LocationOnIcon sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.title}
                    secondary={location.category}
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
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                {userMarkerCount} / {maxMarkers === Infinity ? '∞' : maxMarkers}
              </Typography>
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
            >
              UPGRADE TO PRO
            </Button>
          )}
        </Box>

        
      </Box>
    </Paper>
  );
}

export default ProgressTracker;
