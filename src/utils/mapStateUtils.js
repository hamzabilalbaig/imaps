/**
 * Utility functions for preserving map state across page reloads
 */

// Keys for storing map state in localStorage
const MAP_CENTER_KEY = 'imaps_map_center';
const MAP_ZOOM_KEY = 'imaps_map_zoom';

/**
 * Save current map view state to localStorage
 * @param {Object} map - Leaflet map instance
 */
export const saveMapState = (map) => {
  try {
    // If map not provided, try to use the global reference
    const mapInstance = map || window.leafletMap;
    if (!mapInstance) return;
    
    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();
    
    localStorage.setItem(MAP_CENTER_KEY, JSON.stringify([center.lat, center?.lng]));
    localStorage.setItem(MAP_ZOOM_KEY, zoom.toString());
    
    console.log('Saved map state:', { center: [center.lat, center?.lng], zoom });
  } catch (error) {
    console.error('Error saving map state:', error);
  }
};

/**
 * Restore map view state from localStorage
 * @param {Object} map - Leaflet map instance
 * @returns {boolean} - True if state was restored, false if no saved state exists
 */
export const restoreMapState = (map) => {
  try {
    if (!map) return false;
    
    const centerStr = localStorage.getItem(MAP_CENTER_KEY);
    const zoomStr = localStorage.getItem(MAP_ZOOM_KEY);
    
    if (!centerStr || !zoomStr) return false;
    
    const center = JSON.parse(centerStr);
    const zoom = parseInt(zoomStr, 10);
    
    // Only restore if we have valid values
    if (center && center.length === 2 && !isNaN(zoom)) {
      map.setView(center, zoom, { animate: false });
      console.log('Restored map state:', { center, zoom });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring map state:', error);
    return false;
  }
};

/**
 * Clear saved map state from localStorage
 */
export const clearMapState = () => {
  localStorage.removeItem(MAP_CENTER_KEY);
  localStorage.removeItem(MAP_ZOOM_KEY);
};

/**
 * Helper function that saves map state before executing an operation that causes page reload
 * @param {Function} operation - The function to execute that may cause a page reload
 * @param {Array} args - Arguments to pass to the operation function
 */
export const withMapStatePreservation = async (operation, ...args) => {
  // Save map state before operation
  saveMapState();
  
  // Execute the operation with provided arguments
  return operation(...args);
};
