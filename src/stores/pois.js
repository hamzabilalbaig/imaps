import { create } from 'zustand';
import {
  getAllPOIs,
  getPOIById,
  createPOI,
  updatePOIById,
  deletePOIById,
  getMyPOIs,
  createMyPOI
} from '../api/functions/apiFunctions';

const ensureNumberPair = (pair) => {
  if (!Array.isArray(pair) || pair.length < 2) {
    return null;
  }

  const lat = Number(pair[0]);
  const lng = Number(pair[1]);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lat, lng];
};

const parseCoords = (coords) => {
  if (!coords && coords !== 0) {
    return null;
  }

  if (Array.isArray(coords)) {
    return ensureNumberPair(coords);
  }

  if (typeof coords === 'object' && coords !== null) {
    if (coords.lat != null && coords.lng != null) {
      return ensureNumberPair([coords.lat, coords.lng]);
    }
    if (coords.latitude != null && coords.longitude != null) {
      return ensureNumberPair([coords.latitude, coords.longitude]);
    }
  }

  if (typeof coords === 'string') {
    const trimmed = coords.trim();

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return ensureNumberPair(parsed);
      }

      if (parsed && typeof parsed === 'object') {
        const { lat, lng, latitude, longitude } = parsed;

        if (lat != null && lng != null) {
          return ensureNumberPair([lat, lng]);
        }

        if (latitude != null && longitude != null) {
          return ensureNumberPair([latitude, longitude]);
        }
      }
    } catch (error) {
      const matches = trimmed.match(/-?\d+(?:\.\d+)?/g);

      if (matches && matches.length >= 2) {
        return ensureNumberPair(matches.slice(0, 2));
      }
    }

    const commaSeparated = trimmed.split(',').map((part) => part.replace(/[^0-9+\-\.]/g, ''));

    if (commaSeparated.length >= 2) {
      return ensureNumberPair(commaSeparated.slice(0, 2));
    }
  }

  return null;
};

const transformPOI = (poi) => {
  const rawCoords = poi?.position ?? poi?.coords;
  const position = parseCoords(rawCoords);

  return {
    ...poi,
    position
  };
};

const usePOIsStore = create((set, get) => ({
  // State
  pois: [],
  myPois: [],
  currentPOI: null,
  loading: false,
  error: null,

  // Actions
  
    // Initialize POIs from API
  initializePOIs: async () => {
    const currentPOIs = get().pois;
    console.log('POI Store - Current POIs count:', currentPOIs.length);
    if (currentPOIs.length > 0) return; // Already initialized
    
    try {
      console.log('POI Store - Starting to load POIs...');
      set({ loading: true, error: null });
      const pois = await getAllPOIs();
      console.log('POI Store - Received POIs from API:', pois?.length, pois);

      const transformedPOIs = (pois || []).map(transformPOI);
      console.log('POI Store - Transformed POIs:', transformedPOIs.length, transformedPOIs);
      
      set({ 
        pois: transformedPOIs,
        loading: false 
      });
    } catch (error) {
      console.error('Error loading POIs:', error);
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },

  // Fetch all POIs
  fetchPOIs: async () => {
    try {
      set({ loading: true, error: null });
      const pois = await getAllPOIs();
      const transformedPOIs = (pois || []).map(transformPOI);
      set({ 
        pois: transformedPOIs,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching POIs:', error);
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },
  // Fetch all POIs
  fetchPOIs: async () => {
    try {
      set({ loading: true, error: null });
      const pois = await getAllPOIs();
      const transformedPOIs = (pois || []).map(transformPOI);
      set({ 
        pois: transformedPOIs,
        loading: false 
      });
      return { success: true, pois: transformedPOIs };
    } catch (error) {
      console.error('Error fetching POIs:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Fetch a single POI by ID
  fetchPOIById: async (id) => {
    try {
      set({ loading: true, error: null });
      const poi = await getPOIById(id);
      const transformedPOI = transformPOI(poi);
      set({ 
        currentPOI: transformedPOI,
        loading: false 
      });
      return { success: true, poi: transformedPOI };
    } catch (error) {
      console.error('Error fetching POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Create a new POI
  createPOI: async (poiData) => {
    try {
      set({ loading: true, error: null });
      const newPOI = await createPOI(poiData);
      const transformedPOI = transformPOI(newPOI);
      
      // Add to local state
      const currentPOIs = get().pois;
      set({ 
        pois: [...currentPOIs, transformedPOI],
        loading: false 
      });
      
      return { success: true, poi: transformedPOI };
    } catch (error) {
      console.error('Error creating POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update an existing POI
  updatePOI: async (id, poiData) => {
    try {
      set({ loading: true, error: null });
      const updatedPOI = transformPOI(await updatePOIById(id, poiData));
      
      // Update in local state
      const currentPOIs = get().pois;
      const updatedPOIs = currentPOIs.map(poi => 
        poi.id === id ? updatedPOI : poi
      );
      
      // Also update myPois if the POI is in that list
      const currentMyPOIs = get().myPois;
      const updatedMyPOIs = currentMyPOIs.map(poi => 
        poi.id === id ? updatedPOI : poi
      );
      
      set({ 
        pois: updatedPOIs,
        myPois: updatedMyPOIs,
        currentPOI: get().currentPOI?.id === id ? updatedPOI : get().currentPOI,
        loading: false 
      });
      
      return { success: true, poi: updatedPOI };
    } catch (error) {
      console.error('Error updating POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Delete a POI
  deletePOI: async (id) => {
    try {
      set({ loading: true, error: null });
      await deletePOIById(id);
      
      // Remove from local state - capture all state at once
      const state = get();
      const filteredPOIs = state.pois.filter(poi => poi.id !== id);
      const filteredMyPOIs = state.myPois.filter(poi => poi.id !== id);
      const updatedCurrentPOI = state.currentPOI?.id === id ? null : state.currentPOI;
      
      set({ 
        pois: filteredPOIs,
        myPois: filteredMyPOIs,
        currentPOI: updatedCurrentPOI,
        loading: false 
      });
      
      console.log(`POI ${id} deleted. Updated pois count: ${filteredPOIs.length}, myPois count: ${filteredMyPOIs.length}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  approvePOI: async (id, poiData) => {
    try {
      set({ loading: true, error: null });

      // Ensure we send the full POI payload to the API so required fields
      // like sub_category_id are not omitted. Prefer the passed poiData,
      // fall back to local state, and finally fetch from the API if needed.
      let existing = poiData || get().getPOIById(id);
      if (!existing) {
        // Lazily import the getPOIById API function to avoid circular issues
        const { getPOIById: fetchPOIByIdFromApi } = await import('../api/functions/apiFunctions');
        try {
          existing = await fetchPOIByIdFromApi(id);
        } catch (fetchErr) {
          console.warn('approvePOI: failed to fetch POI from API, proceeding with minimal payload', fetchErr);
          existing = {};
        }
      }

  const payload = { ...existing, ...(poiData || {}), is_approved: true };
  const updatedPOI = transformPOI(await updatePOIById(id, payload));

      // Update local store entries to reflect approval immediately
      const currentPOIs = get().pois;
  const updatedPOIs = currentPOIs.map(poi => (poi.id === id ? updatedPOI : poi));

      const currentMyPOIs = get().myPois;
      const updatedMyPOIs = currentMyPOIs.map(poi => (poi.id === id ? updatedPOI : poi));

      set({
        pois: updatedPOIs,
        myPois: updatedMyPOIs,
        currentPOI: get().currentPOI?.id === id ? updatedPOI : get().currentPOI,
        loading: false
      });

      return { success: true, poi: updatedPOI };
    } catch (error) {
      console.error('Error approving POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Clear current POI
  clearCurrentPOI: () => {
    set({ currentPOI: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Clear all POIs (useful for logout)
  clearPOIs: () => {
    set({ 
      pois: [],
      currentPOI: null,
      error: null 
    });
  },

  // Get POI by ID from local state
  getPOIById: (id) => {
    const pois = get().pois;
    return pois.find(poi => poi.id === id);
  },

  // Get POIs by subcategory ID
  getPOIsBySubCategoryId: (subCategoryId) => {
    const pois = get().pois;
    return pois.filter(poi => poi.sub_category_id === subCategoryId);
  },

  // Get POIs by name pattern (useful for search)
  getPOIsByName: (searchTerm) => {
    const pois = get().pois;
    return pois.filter(poi => 
      poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (poi.description && poi.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  // Get approved POIs only
  getApprovedPOIs: () => {
    const pois = get().pois;
    return pois.filter(poi => poi.is_approved === true);
  },

  // Get pending POIs (not approved)
  getPendingPOIs: () => {
    const pois = get().pois;
    return pois.filter(poi => poi.is_approved === false);
  },

  // Check if POI name exists in subcategory (useful for validation)
  poiNameExists: (name, subCategoryId, excludeId = null) => {
    const pois = get().pois;
    return pois.some(poi => 
      poi.name.toLowerCase() === name.toLowerCase() && 
      poi.sub_category_id === subCategoryId &&
      poi.id !== excludeId
    );
  },

  // Get total POIs count
  getPOIsCount: () => {
    return get().pois.length;
  },

  // Get POIs count for a specific subcategory
  getPOIsCountBySubCategory: (subCategoryId) => {
    const pois = get().pois;
    return pois.filter(poi => poi.sub_category_id === subCategoryId).length;
  },

  // Get approved POIs count for a specific subcategory
  getApprovedPOIsCountBySubCategory: (subCategoryId) => {
    const pois = get().pois;
    return pois.filter(poi => 
      poi.sub_category_id === subCategoryId && poi.is_approved === true
    ).length;
  },

  // Refresh POIs (force reload)
  refreshPOIs: async () => {
    set({ pois: [] }); // Clear current POIs
    return get().fetchPOIs();
  },

  // Get POIs grouped by subcategory
  getPOIsGroupedBySubCategory: () => {
    const pois = get().pois;
    return pois.reduce((acc, poi) => {
      const subCategoryId = poi.sub_category_id;
      if (!acc[subCategoryId]) {
        acc[subCategoryId] = [];
      }
      acc[subCategoryId].push(poi);
      return acc;
    }, {});
  },

  // Get POIs by coordinates (within a radius)
  getPOIsNearLocation: (latitude, longitude, radiusKm = 1) => {
    const pois = get().pois;
    return pois.filter(poi => {
      const position = poi.position || parseCoords(poi.coords);
      if (!position) {
        return false;
      }

      const [poiLat, poiLng] = position;

      const distance = Math.sqrt(
        Math.pow(poiLat - latitude, 2) + 
        Math.pow(poiLng - longitude, 2)
      );
      
      // Rough conversion to km (this is approximate)
      return distance <= radiusKm / 111;
    });
  },

  // Toggle POI approval status
  togglePOIApproval: async (id) => {
    try {
      const poi = get().getPOIById(id);
      if (!poi) return { success: false, error: 'POI not found' };
      
      const updatedData = { ...poi, is_approved: !poi.is_approved };
      return await get().updatePOI(id, updatedData);
    } catch (error) {
      console.error('Error toggling POI approval:', error);
      return { success: false, error: error.message };
    }
  },

  // My POI Actions
  
  // Fetch My POIs for a specific user
  fetchMyPOIs: async (userId) => {
    try {
      set({ loading: true, error: null });
      const myPois = await getMyPOIs(userId);
      const transformedMyPOIs = (myPois || []).map(transformPOI);
      
      set({ 
        myPois: transformedMyPOIs,
        loading: false 
      });
      return { success: true, myPois: transformedMyPOIs };
    } catch (error) {
      console.error('Error fetching My POIs:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Create a new My POI
  createMyPOI: async (poiData) => {
    try {
      set({ loading: true, error: null });
      const newMyPOI = await createMyPOI(poiData);
      const transformedPOI = transformPOI(newMyPOI);
      const currentMyPOIs = get().myPois;
      set({ 
        myPois: [...currentMyPOIs, transformedPOI],
        loading: false 
      });
      
      return { success: true, poi: transformedPOI };
    } catch (error) {
      console.error('Error creating My POI:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Get all POIs including My POIs for display
  getAllPOIsForDisplay: (userId = null, isAdmin = false) => {
    const regularPOIs = get().pois;
    const myPois = get().myPois;
    
    let filteredRegularPOIs = regularPOIs;
    
    if (!isAdmin) {
      // For all non-admin users (including authenticated users), only show approved POIs
      filteredRegularPOIs = regularPOIs.filter(poi => {
        const isApproved = poi.is_approved === true || poi.is_approved === 1 || poi.is_approved === 'true';
        return isApproved;
      });
    }
    
    // For admin, show all regular POIs
    // For users, show both filtered regular POIs and their My POIs
    if (userId && !isAdmin) {
      return [...filteredRegularPOIs, ...myPois];
    }
    return filteredRegularPOIs;
  },

  // Get My POI count for a user
  getMyPOICount: (userId) => {
    return get().myPois.filter(poi => poi.user_id === userId).length;
  },
}));

export default usePOIsStore;