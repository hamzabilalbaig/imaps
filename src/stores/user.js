import { create } from 'zustand';
import { authenticateUser, getAllUsers } from '../api/functions/apiFunctions';
import { localDB } from '../utils/localStorage';

export const PLAN_LIMITS = {
  free: { 
    maxCustomCategories: 10,
    maxPOIsPerCategory: 10,
    totalPOILimit: 100,
    allowCustomIcons: false
  },
  premium: { 
    maxCustomCategories: 20,
    maxPOIsPerCategory: 20,
    totalPOILimit: 400,
    allowCustomIcons: false
  },
  unlimited: { 
    maxCustomCategories: Infinity,
    maxPOIsPerCategory: Infinity,
    totalPOILimit: Infinity,
    allowCustomIcons: true
  }
};

const useUserStore = create((set, get) => ({

  id: null,
  name: '',
  email: '',
  plan: '',
  role: '',
  isadmin: false,
  

  loading: false,
  

  passwordResetStatus: null,
  passwordResetError: null,
  passwordResetSuccess: false,
  

  initializeUser: () => {
    const state = get();
  
    if (state.id) return;
    
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
    const { id, plan } = get();
    if (!id) return false;
    const limit = PLAN_LIMITS[plan]?.totalPOILimit || 0;
    return currentPOICount < limit;
  },

  getRemainingPOIs: (currentPOICount) => {
    const { id, plan } = get();
    if (!id) return 0;
    const limit = PLAN_LIMITS[plan]?.totalPOILimit || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICount);
  },

  canCreateCategory: (currentCategoryCount) => {
    const { id, plan } = get();
    if (!id) return false;
    const limit = PLAN_LIMITS[plan]?.maxCustomCategories || 0;
    return limit === Infinity || currentCategoryCount < limit;
  },

  canAddPOItoCategory: async (categoryName) => {
    const { id, plan } = get();
    if (!id) return false;
    const limit = PLAN_LIMITS[plan]?.maxPOIsPerCategory || 0;

    const userPois = await localDB.getUserPOIs();
    const filteredPois = userPois.filter(poi => poi.category === categoryName);
    const lengthOfPoisBelongingToCategoryName = filteredPois.length;

    if (limit === Infinity) {
      return true;
    }
    const result = (lengthOfPoisBelongingToCategoryName >= PLAN_LIMITS[plan]?.maxPOIsPerCategory) ? false : true;
    return result;
  },

  canUseCustomIcons: () => {
    const { id, plan } = get();
    if (!id) return false;
    return PLAN_LIMITS[plan]?.allowCustomIcons || false;
  },

  getRemainingCategories: (currentCategoryCount) => {
    const { id, plan } = get();
    if (!id) return 0;
    const limit = PLAN_LIMITS[plan]?.maxCustomCategories || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentCategoryCount);
  },

  getRemainingPOIsForCategory: (currentPOICountInCategory) => {
    const { id, plan } = get();
    if (!id) return 0;
    const limit = PLAN_LIMITS[plan]?.maxPOIsPerCategory || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICountInCategory);
  },
}));

export default useUserStore;