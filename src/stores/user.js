import { create } from 'zustand';
import { 
  authenticateUser, 
  getAllUsers, 
  getFoundLocations, 
  addFoundLocation, 
  removeFoundLocation, 
  checkIfFound 
} from '../api/functions/apiFunctions';
import { localDB } from '../utils/localStorage';
import { fetchPlanLimits } from '../utils/planLimits';

const useUserStore = create((set, get) => ({

  id: null,
  name: '',
  email: '',
  plan: '',
  role: '',
  isadmin: false,
  
  // Dynamic plan limits from database
  planLimits: null,

  loading: false,
  

  passwordResetStatus: null,
  passwordResetError: null,
  passwordResetSuccess: false,
  

  // Found locations state
  foundLocations: [],
  foundLocationsLoading: false,
  

  initializeUser: async () => {
    const state = get();
  
    if (state.id) {
      // Load plan limits even if user is already loaded
      if (!state.planLimits) {
        await get().loadPlanLimits();
      }
      return;
    }
    
    try {
      const savedUser = localStorage.getItem('imaps_current_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        set({
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          role: user.role,
          isadmin: user.isadmin,
        });
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      localStorage.removeItem('imaps_current_user');
    }
    
    // Always load plan limits
    await get().loadPlanLimits();
  },
  
  // Load plan limits from database
  loadPlanLimits: async () => {
    try {
      const limits = await fetchPlanLimits();
      set({ planLimits: limits });
    } catch (error) {
      console.error('Error loading plan limits:', error);
      // Set fallback limits if loading fails
      set({ 
        planLimits: {
          free: { 
            maxCustomCategories: 10,
            totalPOILimit: 100,
            maxNotes: 5,
            allowCustomIcons: false
          },
          premium: { 
            maxCustomCategories: 20,
            totalPOILimit: 400,
            maxNotes: 50,
            allowCustomIcons: false
          },
          unlimited: { 
            maxCustomCategories: Infinity,
            totalPOILimit: Infinity,
            maxNotes: Infinity,
            allowCustomIcons: true
          }
        }
      });
    }
  },

  isAuthenticated: () => !!get().id,
  isUserAdmin: () => get().isadmin,
  

  authenticate: async (email, password) => {
    try {
      const res = await authenticateUser(email, password);
      if (!res.success) {
        throw new Error(res.error || 'Failed to authenticate user');
      }
      
      const user = res.user;
      set({ 
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.isadmin ? 'admin' : 'user',
        isadmin: user.isadmin,
      });
    
      localStorage.setItem('imaps_current_user', JSON.stringify(user));
      
      // Load plan limits after successful authentication
      await get().loadPlanLimits();
      
      return { success: true, user };
    } catch (error) {
      console.error('Error authenticating user:', error);
      
      // Handle specific error cases more gracefully
      if (error.message && error.message.includes('401')) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      return { success: false, error: error.message || 'Authentication failed' };
    }
  },


  fetchUser: async (userId) => {
    try {
      const res = await getAllUsers();
      const user = res.find((user) => user.id === userId);
      if (!user) throw new Error('Failed to fetch user');
      set({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        isadmin: user?.isadmin,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  },

  clearUser: () => {
    localStorage.removeItem('imaps_current_user');
    set({ 
      id: null, 
      name: '', 
      email: '', 
      plan: '', 
      role: '',
      isadmin: false,
      passwordResetStatus: null,
      passwordResetError: null,
      passwordResetSuccess: false
    });
  },


  logout: () => {
    const { clearUser } = get();
    clearUser();
  },


  requestPasswordReset: async (email) => {
    set({ passwordResetStatus: 'pending', passwordResetError: null });
    try {
      const response = await fetch('/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error requesting password reset');
      }
      
      set({ 
        passwordResetStatus: 'sent', 
        passwordResetError: null
      });
      
      return { success: true, message: data.message };
    } catch (error) {
      set({ 
        passwordResetStatus: 'error', 
        passwordResetError: error.message 
      });
      return { success: false, error: error.message };
    }
  },


  resetPassword: async (token, newPassword) => {
    set({ passwordResetStatus: 'resetting', passwordResetError: null });
    try {
      const response = await fetch('/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error resetting password');
      }
      
      set({ 
        passwordResetStatus: 'success', 
        passwordResetSuccess: true,
        passwordResetError: null
      });
      
      return { success: true, message: data.message };
    } catch (error) {
      set({ 
        passwordResetStatus: 'error', 
        passwordResetSuccess: false,
        passwordResetError: error.message 
      });
      return { success: false, error: error.message };
    }
  },


  clearPasswordResetState: () => {
    set({
      passwordResetStatus: null,
      passwordResetError: null,
      passwordResetSuccess: false
    });
  },


  upgradePlan: (newPlan) => {
    const { id } = get();
    if (id) {
      const result = localDB.updateUserPlan(newPlan);
      if (result.success) {
        set({ plan: newPlan });
      
        const savedUser = localStorage.getItem('imaps_current_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.plan = newPlan;
          localStorage.setItem('imaps_current_user', JSON.stringify(user));
        }
      }
      return result;
    }
    return { success: false, message: 'No user logged in' };
  },

  canCreatePOI: (currentPOICount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return false;
    const limit = planLimits[plan]?.totalPOILimit || 0;
    return currentPOICount < limit;
  },

  getRemainingPOIs: (currentPOICount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return 0;
    const limit = planLimits[plan]?.totalPOILimit || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICount);
  },

  canCreateCategory: (currentCategoryCount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return false;
    const limit = planLimits[plan]?.maxCustomCategories || 0;
    return limit === Infinity || currentCategoryCount < limit;
  },

  canAddPOI: async () => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return false;
    const limit = planLimits[plan]?.totalPOILimit || 0;

    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;

    if (limit === Infinity) {
      return true;
    }
    const result = totalPoisCount < limit;
    return result;
  },

  canUseCustomIcons: () => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return false;
    return planLimits[plan]?.allowCustomIcons || false;
  },

  getRemainingCategories: (currentCategoryCount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return 0;
    const limit = planLimits[plan]?.maxCustomCategories || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentCategoryCount);
  },

  getRemainingPOIs: async () => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return 0;
    const limit = planLimits[plan]?.totalPOILimit || 0;
    
    if (limit === Infinity) return Infinity;
    
    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;
    
    return Math.max(0, limit - totalPoisCount);
  },

  canCreateNote: (currentNoteCount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return false;
    const limit = planLimits[plan]?.maxNotes || 0;
    return limit === Infinity || currentNoteCount < limit;
  },

  getRemainingNotes: (currentNoteCount) => {
    const { id, plan, planLimits } = get();
    if (!id || !planLimits) return 0;
    const limit = planLimits[plan]?.maxNotes || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentNoteCount);
  },

  // Found Locations methods
  fetchFoundLocations: async () => {
    const { id } = get();
    if (!id) return;
    
    set({ foundLocationsLoading: true });
    try {
      const foundLocations = await getFoundLocations(id);
      set({ foundLocations, foundLocationsLoading: false });
      return foundLocations;
    } catch (error) {
      console.error('Error fetching found locations:', error);
      set({ foundLocationsLoading: false });
      return [];
    }
  },

  addToFoundLocations: async (poiId, notes = null) => {
    const { id, foundLocations } = get();
    if (!id) return { success: false, error: 'No user logged in' };
    
    try {
      const result = await addFoundLocation(id, poiId, notes);
      console.log('Added to found locations - result:', result);
      
      // Update local state
      const existingIndex = foundLocations.findIndex(fl => fl.poi_id === poiId);
      let updatedFoundLocations;
      
      if (existingIndex >= 0) {
        // Update existing entry
        updatedFoundLocations = [...foundLocations];
        updatedFoundLocations[existingIndex] = { ...updatedFoundLocations[existingIndex], ...result };
      } else {
        // Add new entry
        updatedFoundLocations = [result, ...foundLocations];
      }
      
      console.log('Updated found locations state:', updatedFoundLocations);
      set({ foundLocations: updatedFoundLocations });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error adding to found locations:', error);
      return { success: false, error: error.message };
    }
  },

  removeFromFoundLocations: async (poiId) => {
    const { id, foundLocations } = get();
    if (!id) return { success: false, error: 'No user logged in' };
    
    try {
      await removeFoundLocation(id, poiId);
      
      // Update local state
      const updatedFoundLocations = foundLocations.filter(fl => fl.poi_id !== poiId);
      set({ foundLocations: updatedFoundLocations });
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from found locations:', error);
      return { success: false, error: error.message };
    }
  },

  checkIfPOIFound: async (poiId) => {
    const { id } = get();
    if (!id) return { isFound: false };
    
    try {
      const result = await checkIfFound(id, poiId);
      return result;
    } catch (error) {
      console.error('Error checking if POI is found:', error);
      return { isFound: false };
    }
  },

  isLocationFound: (poiId) => {
    const { foundLocations } = get();
    return foundLocations.some(fl => fl.poi_id === poiId);
  },
}));

// Export function to get current plan limits for external use
export const getPlanLimits = () => {
  const state = useUserStore.getState();
  return state.planLimits;
};

export default useUserStore;