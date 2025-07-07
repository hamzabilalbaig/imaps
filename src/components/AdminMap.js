import React, { useState } from "react";
import MapClickHandler from "./MapClickHandler";
import MapMarker from "./MapMarker";
import MapControls from "./MapControls";
import POIForm from "./POIForm";
import POIList from "./POIList";
import LayerManager from "./LayerManager";
import MapWithLayers from "./MapWithLayers";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { MAP_CONFIG } from "../utils/mapUtils";

/**
 * Admin Map component with full editing capabilities
 */
function AdminMap() {
  const { markers, addMarker, updateMarker, removeMarker, clearAllMarkers } = useMapMarkers();
  const [showForm, setShowForm] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pois"); // "pois" or "layers"

  const handleMapClick = (latlng) => {
    setPendingLocation(latlng);
    setEditingPOI(null);
    setShowForm(true);
  };

  const handleEditPOI = (poi) => {
    setEditingPOI(poi);
    setPendingLocation(null);
    setShowForm(true);
  };

  const handleSavePOI = (formData) => {
    if (editingPOI) {
      // Update existing POI
      updateMarker(editingPOI.id, formData);
    } else if (pendingLocation) {
      // Add new POI
      addMarker(pendingLocation, formData);
    }
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPOI(null);
    setPendingLocation(null);
  };

  const handleRemovePOI = (poiId) => {
    if (window.confirm("Are you sure you want to delete this POI?")) {
      removeMarker(poiId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all POIs? This action cannot be undone.")) {
      clearAllMarkers();
    }
  };

  return (
    <div className="w-full h-full flex relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
        //   className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* POI Management Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative z-30 lg:z-auto
        w-auto lg:w-auto
        transition-transform duration-300 ease-in-out
        overflow-y-auto bg-white border-r border-gray-200 h-full max-h-[calc(100vh-64px)]
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-between items-center mb-4 pb-2 border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-4">
          <nav className="-mb-px flex space-x-4">
            <button
              onClick={() => setActiveTab("pois")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pois"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              POI Management
            </button>
            <button
              onClick={() => setActiveTab("layers")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "layers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Map Layers
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "pois" && (
            <POIList
              markers={markers}
              onEdit={handleEditPOI}
              onRemove={handleRemovePOI}
              onClearAll={handleClearAll}
            />
          )}
          {activeTab === "layers" && (
            <LayerManager />
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 flex flex-col z-[1]">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-3 p-2 rounded-md hover:bg-blue-100"
              >
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Admin Mode:</strong> Click on the map to add new POIs. Use the sidebar to manage POIs and map layers.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <MapControls markers={markers} onClearAll={handleClearAll} />

        <div className="flex-1 relative">
          <MapWithLayers
            center={MAP_CONFIG.defaultCenter}
            zoom={MAP_CONFIG.defaultZoom}
            showLayerSelector={true}
            layerSelectorPosition="top-right"
            isAdmin={true}
          >
            <MapClickHandler onMapClick={handleMapClick} />

            {markers.map((marker) => (
              <MapMarker
                key={marker.id}
                marker={marker}
                onRemove={handleRemovePOI}
                onEdit={handleEditPOI}
                isAdmin={true}
              />
            ))}
          </MapWithLayers>
        </div>
      </div>

      {/* POI Form Modal */}
      {showForm && (
        <POIForm
          poi={editingPOI || (pendingLocation ? { coords: `${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}` } : null)}
          onSave={handleSavePOI}
          onCancel={handleCancelForm}
          isEdit={!!editingPOI}
        />
      )}
    </div>
  );
}

export default AdminMap;
