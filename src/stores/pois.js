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
      
      // Transform coords to position for map compatibility
      const transformedPOIs = (pois || []).map(poi => ({
        ...poi,
        position: poi.coords // Add position field for map marker compatibility
      }));
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
      // Transform coords to position for map compatibility
      const transformedPOIs = (pois || []).map(poi => ({
        ...poi,
        position: poi.coords // Add position field for map marker compatibility
      }));
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
      // Transform coords to position for map compatibility
      const transformedPOIs = (pois || []).map(poi => ({
        ...poi,
        position: poi.coords // Add position field for map marker compatibility
      }));
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
      set({ 
        currentPOI: poi,
        loading: false 
      });
      return { success: true, poi };
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
      
      // Add to local state
      const currentPOIs = get().pois;
      set({ 
        pois: [...currentPOIs, newPOI],
        loading: false 
      });
      
      return { success: true, poi: newPOI };
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
      const updatedPOI = await updatePOIById(id, poiData);
      
      // Update in local state
      const currentPOIs = get().pois;
      const updatedPOIs = currentPOIs.map(poi => 
        poi.id === id ? updatedPOI : poi
      );
      
      set({ 
        pois: updatedPOIs,
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
      
      // Remove from local state
      const currentPOIs = get().pois;
      const filteredPOIs = currentPOIs.filter(poi => poi.id !== id);
      
      set({ 
        pois: filteredPOIs,
        currentPOI: get().currentPOI?.id === id ? null : get().currentPOI,
        loading: false 
      });
      
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
      const updatedPOI = await updatePOIById(id, { ...poiData, is_approved: true });
      set({ loading: false });
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
      if (!poi.coords) return false;
      
      // Simple distance calculation (you might want to use a more accurate method)
      const poiCoords = JSON.parse(poi.coords);
      const distance = Math.sqrt(
        Math.pow(poiCoords.lat - latitude, 2) + 
        Math.pow(poiCoords.lng - longitude, 2)
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
      
      // Transform coords to position for map compatibility
      const transformedMyPOIs = (myPois || []).map(poi => ({
        ...poi,
        position: poi.coords // Add position field for map marker compatibility
      }));
      
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
      
      // Add to local My POI state
      const currentMyPOIs = get().myPois;
      const transformedPOI = {
        ...newMyPOI,
        position: newMyPOI.coords
      };
      
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