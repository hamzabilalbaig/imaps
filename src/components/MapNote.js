import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { 
  Box,
  IconButton,
  Typography,
  Button,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import L from 'leaflet';
import localDB from '../utils/localStorage';
import { useAlerts } from '../hooks/useAlerts';
import { deleteUserNote } from '../api/functions/apiFunctions';

/**
 * Component for rendering notes on the map
 */
function MapNote({ 
  note, 
  onEdit, 
  onRemove, 
  canEdit = true 
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { confirm } = useAlerts();

  // Create custom icon based on note's color
  const createNoteIcon = () => {
    const noteColor = note.color || '#7c3aed';
    
    // Create a simple note icon with the selected color
    const svgString = `
      <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="${noteColor}" stroke="white" stroke-width="2"/>
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="white" transform="translate(2, 2) scale(0.8)"/>
      </svg>
    `;
    
    const svgUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    
    return new L.Icon({
      iconUrl: svgUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: 'note-marker-icon'
    });
  };

  const handleEdit = () => {
    setIsPopupOpen(false);
    onEdit(note);
  };

  const handleRemove = async () => {
    confirm('Are you sure you want to delete this note?', async () => {
      try {
        setIsPopupOpen(false);
        
        // Delete from local database
        await localDB.deleteNote(note.id);
        
        // Delete from backend API if user is not admin
        const user = JSON.parse(localStorage.getItem('imaps_current_user'));
        if (user && user.role !== 'admin') {
          await deleteUserNote(user.id, note.id);
        }
        
        // Call the parent component's onRemove to update UI state
        if (onRemove) {
          onRemove(note.id);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        // Still call onRemove to update UI even if backend call failed
        if (onRemove) {
          onRemove(note.id);
        }
      }
    });
  };

  // Validate note position before rendering
  if (!note.position || !Array.isArray(note.position) || note.position.length !== 2 ||
      note.position[0] == null || note.position[1] == null || 
      isNaN(note.position[0]) || isNaN(note.position[1])) {
    console.warn('MapNote - Invalid position:', note.position, 'for note:', note);
    return null;
  }

  return (
    <Marker
      position={note.position}
      icon={createNoteIcon()}
      eventHandlers={{
        popupopen: () => setIsPopupOpen(true),
        popupclose: () => setIsPopupOpen(false)
      }}
    >
      <Popup 
        minWidth={280}
        maxWidth={400}
        closeOnClick={false}
        autoClose={false}
      >
        <Box sx={{ p: 1 }}>
          {/* Note Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NoteIcon sx={{ 
                color: note.color || '#7c3aed', 
                mr: 1, 
                fontSize: '1.2rem' 
              }} />
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                sx={{ fontSize: '1rem' }}
              >
                {note.title}
              </Typography>
            </Box>
            
            
              <Box>
                <IconButton 
                  size="small" 
                  onClick={handleEdit}
                  sx={{ p: 0.5, mr: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={handleRemove}
                  sx={{ p: 0.5 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            
          </Box>

          {/* Note Description */}
          {note.description && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                fontSize: '0.875rem',
                lineHeight: 1.4,
                color: 'text.secondary'
              }}
            >
              {note.description}
            </Typography>
          )}

          {/* Note Metadata */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5
          }}>
            <Chip
              label="Personal Note"
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                height: 20,
                backgroundColor: note.color || '#7c3aed',
                color: 'white',
                alignSelf: 'flex-start'
              }}
            />
            
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              Created: {new Date(note.createdat || note.createdAt).toLocaleDateString()}
            </Typography>

            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              Updated: {new Date(note.updatedat || note.updatedAt).toLocaleDateString()}
            </Typography>
            
            {/* <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              {note.coords}
            </Typography> */}
          </Box>
        </Box>
      </Popup>
    </Marker>
  );
}

export default MapNote;