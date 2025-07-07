import React, { useState } from "react";
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
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Map Layers</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddLayer}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Layer
            </button>
            <button
              onClick={handleResetLayers}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {/* Built-in Layers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Built-in Layers</h4>
            <div className="space-y-2">
              {builtinLayers.map((layer) => (
                <div
                  key={layer.id}
                  className={`p-3 border rounded-lg ${
                    layer.isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="activeLayer"
                        checked={layer.isActive}
                        onChange={() => setActiveLayer(layer.id)}
                        className="mr-2"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{layer.name}</span>
                        {layer.isActive && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Layers */}
          {customLayers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Layers</h4>
              <div className="space-y-2">
                {customLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-3 border rounded-lg ${
                      layer.isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="activeLayer"
                          checked={layer.isActive}
                          onChange={() => setActiveLayer(layer.id)}
                          className="mr-2"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{layer.name}</span>
                          {layer.isActive && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Max Zoom: {layer.maxZoom}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditLayer(layer)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Edit layer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveLayer(layer)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove layer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Layer Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingLayer ? "Edit Layer" : "Add New Layer"}
              </h3>
              
              <form onSubmit={handleSaveLayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Satellite View"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tile URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/{z}/{x}/{y}.png"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL must include {"{z}"}, {"{x}"}, and {"{y}"} placeholders
                  </p>
                  {formData.url && !validateLayerUrl(formData.url) && (
                    <p className="text-xs text-red-500 mt-1">
                      Invalid URL format. Must include {"{z}"}, {"{x}"}, and {"{y}"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attribution
                  </label>
                  <input
                    type="text"
                    value={formData.attribution}
                    onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="© Map provider name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Zoom Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="22"
                    value={formData.maxZoom}
                    onChange={(e) => setFormData({ ...formData, maxZoom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!validateLayerUrl(formData.url) || !formData.name.trim()}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingLayer ? "Update Layer" : "Add Layer"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerManager;
