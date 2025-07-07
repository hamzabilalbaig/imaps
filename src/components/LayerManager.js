import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton,
  Alert,
  Divider
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { useMapLayers } from "../hooks/useMapLayers";

/**
 * Component for managing map layers in admin panel
 */
function LayerManager() {
  const {
    layers,
    activeLayer,
    builtinLayers,
    customLayers,
    addLayer,
    updateLayer,
    removeLayer,
    setActiveLayer,
    resetToDefaults,
  } = useMapLayers();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLayer, setEditingLayer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    attribution: "",
    maxZoom: 18,
  });

  const handleAddLayer = () => {
    setEditingLayer(null);
    setFormData({ name: "", url: "", attribution: "", maxZoom: 18 });
    setShowAddForm(true);
  };

  const handleEditLayer = (layer) => {
    setEditingLayer(layer);
    setFormData({
      name: layer.name,
      url: layer.url,
      attribution: layer.attribution || "",
      maxZoom: layer.maxZoom || 18,
    });
    setShowAddForm(true);
  };

  const handleSaveLayer = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      alert("Please fill in the required fields (Name and URL)");
      return;
    }

    if (editingLayer) {
      updateLayer(editingLayer.id, {
        name: formData.name.trim(),
        url: formData.url.trim(),
        attribution: formData.attribution.trim(),
        maxZoom: parseInt(formData.maxZoom) || 18,
      });
    } else {
      addLayer({
        name: formData.name.trim(),
        url: formData.url.trim(),
        attribution: formData.attribution.trim(),
        maxZoom: parseInt(formData.maxZoom) || 18,
      });
    }

    setShowAddForm(false);
    setEditingLayer(null);
    setFormData({ name: "", url: "", attribution: "", maxZoom: 18 });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingLayer(null);
    setFormData({ name: "", url: "", attribution: "", maxZoom: 18 });
  };

  const handleRemoveLayer = (layer) => {
    if (layer.isDefault) {
      alert("Cannot remove default layers");
      return;
    }

    if (window.confirm(`Are you sure you want to remove the layer "${layer.name}"?`)) {
      removeLayer(layer.id);
    }
  };

  const handleResetLayers = () => {
    if (window.confirm("Are you sure you want to reset all layers to defaults? This will remove all custom layers.")) {
      resetToDefaults();
    }
  };

  const validateLayerUrl = (url) => {
    // Basic validation for tile URL format
    return url.includes("{z}") && url.includes("{x}") && url.includes("{y}");
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h6" component="h3" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Map Layers
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              onClick={handleAddLayer}
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              Add Layer
            </Button>
            <Button
              onClick={handleResetLayers}
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Built-in Layers */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Built-in Layers
            </Typography>
            <RadioGroup
              value={activeLayer?.id || ''}
              onChange={(e) => setActiveLayer(e.target.value)}
            >
              {builtinLayers.map((layer) => (
                <Card 
                  key={layer.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1,
                    backgroundColor: layer.isActive ? 'primary.50' : 'background.paper',
                    borderColor: layer.isActive ? 'primary.main' : 'grey.300'
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <FormControlLabel
                      value={layer.id}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {layer.name}
                          </Typography>
                          {layer.isActive && (
                            <Chip label="Active" color="primary" size="small" />
                          )}
                        </Box>
                      }
                      sx={{ margin: 0 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </Box>

          {/* Custom Layers */}
          {customLayers.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Custom Layers
                </Typography>
                <RadioGroup
                  value={activeLayer?.id || ''}
                  onChange={(e) => setActiveLayer(e.target.value)}
                >
                  {customLayers.map((layer) => (
                    <Card 
                      key={layer.id} 
                      variant="outlined" 
                      sx={{ 
                        mb: 1,
                        backgroundColor: layer.isActive ? 'primary.50' : 'background.paper',
                        borderColor: layer.isActive ? 'primary.main' : 'grey.300'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <FormControlLabel
                            value={layer.id}
                            control={<Radio />}
                            label={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {layer.name}
                                  </Typography>
                                  {layer.isActive && (
                                    <Chip label="Active" color="primary" size="small" />
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Max Zoom: {layer.maxZoom}
                                </Typography>
                              </Box>
                            }
                            sx={{ margin: 0, flex: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              onClick={() => handleEditLayer(layer)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleRemoveLayer(layer)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      {/* Add/Edit Layer Form Dialog */}
      <Dialog 
        open={showAddForm} 
        onClose={handleCancelForm} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSaveLayer
        }}
      >
        <DialogTitle>
          {editingLayer ? "Edit Layer" : "Add New Layer"}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Layer Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Satellite View"
            />

            <Box>
              <TextField
                label="Tile URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                fullWidth
                required
                placeholder="https://example.com/{z}/{x}/{y}.png"
                helperText="URL must include {z}, {x}, and {y} placeholders"
                error={formData.url && !validateLayerUrl(formData.url)}
              />
              {formData.url && !validateLayerUrl(formData.url) && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Invalid URL format. Must include {"{z}"}, {"{x}"}, and {"{y}"}
                </Alert>
              )}
            </Box>

            <TextField
              label="Attribution"
              value={formData.attribution}
              onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
              fullWidth
              placeholder="© Map provider name"
            />

            <TextField
              label="Max Zoom Level"
              type="number"
              inputProps={{ min: 1, max: 22 }}
              value={formData.maxZoom}
              onChange={(e) => setFormData({ ...formData, maxZoom: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCancelForm}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={!validateLayerUrl(formData.url) || !formData.name.trim()}
            startIcon={<SaveIcon />}
          >
            {editingLayer ? "Update Layer" : "Add Layer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default LayerManager;
