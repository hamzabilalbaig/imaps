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

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsPopupOpen(false);
      onRemove(note.id);
    }
  };

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
            
            {canEdit && (
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
            )}
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
              Created: {new Date(note.createdat).toLocaleDateString()}
            </Typography>

            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              Updated: {new Date(note.updatedat).toLocaleDateString()}
            </Typography>
            
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              {note.coords}
            </Typography>
          </Box>
        </Box>
      </Popup>
    </Marker>
  );
}

export default MapNote;