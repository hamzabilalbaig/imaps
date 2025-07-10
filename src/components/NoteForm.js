import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon, Note as NoteIcon } from "@mui/icons-material";
import ColorPicker from "./ColorPicker";

/**
 * Form component for adding or editing Notes
 */
function NoteForm({ note, onSave, onCancel, isEdit = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#7c3aed"
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    if (note && isEdit) {
      setFormData({
        title: note.title || "",
        description: note.description || "",
        color: note.color || "#7c3aed"
      });
    }
  }, [note, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a title for the note");
      return;
    }
    
    console.log('NoteForm submitting data:', formData);
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
  };

  return (
    <Dialog 
      open={true} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: {
          ...(isMobile && {
            m: 0,
            maxHeight: '100vh',
            borderRadius: 0,
            maxWidth: '100vw'
          }),
          ...(isTablet && !isMobile && {
            m: 1,
            maxWidth: 'calc(100vw - 32px)'
          })
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: '1px solid',
        borderColor: 'grey.100',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        p: { xs: 2, md: 3 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              backgroundColor: 'secondary.main',
              borderRadius: 2,
              p: { xs: 0.75, md: 1 },
              mr: { xs: 1.5, md: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <NoteIcon sx={{ color: 'white', fontSize: { xs: 16, md: 20 } }} />
          </Box>
          <Typography variant="h5" component="h2" fontWeight={600} sx={{ fontSize: { xs: '1.125rem', md: '1.5rem' } }}>
            {isEdit ? "Edit Note" : "Add New Note"}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pt: 1 }}>
          <TextField
            name="title"
            label="Note Title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Enter a title for this note"
            helperText="Required field"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />

          <TextField
            name="description"
            label="Note Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            placeholder="Add any details or content for this note"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Choose Color
            </Typography>
            <ColorPicker
              selectedColor={formData.color}
              onColorChange={handleColorChange}
            />
          </Box>

          {note && (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'info.light',
                backgroundColor: 'info.50',
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                <strong>Location:</strong> {note.coords}
              </Typography>
              {isEdit && (
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Created:</strong>{" "}
                  {new Date(note.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'grey.100',
        backgroundColor: 'grey.50',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button 
          onClick={onCancel} 
          startIcon={<CancelIcon />}
          color="inherit"
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontSize: { xs: '0.875rem', md: '1rem' },
            borderColor: 'grey.300',
            '&:hover': {
              borderColor: 'grey.400',
              backgroundColor: 'grey.50'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          startIcon={<SaveIcon />}
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontSize: { xs: '0.875rem', md: '1rem' },
            ml: { xs: 0, sm: 1 },
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)'
            }
          }}
        >
          {isEdit ? "Update Note" : "Add Note"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NoteForm;
