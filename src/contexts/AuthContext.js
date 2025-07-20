import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDB } from '../utils/localStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Plan limits
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session
    const currentUser = localDB.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, expectedRole = null) => {
    const result = localDB.loginUser(email, password);
    if (result.success) {
      // If expectedRole is specified, validate it matches the user's role
      if (expectedRole && result.user.role !== expectedRole) {
        if (expectedRole === 'admin' && result.user.role === 'user') {
          return { success: false, error: 'These credentials are for a regular user account. Please use User Login.' };
        } else if (expectedRole === 'user' && result.user.role === 'admin') {
          return { success: false, error: 'These credentials are for an admin account. Please use Admin Login.' };
        }
      }
      
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.message };
  };

  const register = async (email, password, name, role = 'user') => {
    const result = localDB.registerUser(email, password, name);
    if (result.success) {
      // Auto-login after registration
      const loginResult = localDB.loginUser(email, password);
      if (loginResult.success) {
        setUser(loginResult.user);
      }
    }
    return result;
  };

  const logout = () => {
    localDB.logoutUser();
    setUser(null);
  };

  const upgradePlan = (newPlan) => {
    if (user) {
      const result = localDB.updateUserPlan(newPlan);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    }
    return { success: false, message: 'No user logged in' };
  };

  const canCreatePOI = (currentPOICount) => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.totalPOILimit || 0;
    return currentPOICount < limit;
  };

  const getRemainingPOIs = (currentPOICount) => {
    if (!user) return 0;
    const limit = PLAN_LIMITS[user.plan]?.totalPOILimit || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICount);
  };

  const canCreateCategory = (currentCategoryCount) => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.maxCustomCategories || 0;
    return limit === Infinity || currentCategoryCount < limit;
  };

  const canAddPOItoCategory = (categoryId, currentPOICountInCategory) => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.maxPOIsPerCategory || 0;
    return limit === Infinity || currentPOICountInCategory < limit;
  };

  const canUseCustomIcons = () => {
    if (!user) return false;
    return PLAN_LIMITS[user.plan]?.allowCustomIcons || false;
  };

  const getRemainingCategories = (currentCategoryCount) => {
    if (!user) return 0;
    const limit = PLAN_LIMITS[user.plan]?.maxCustomCategories || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentCategoryCount);
  };

  const getRemainingPOIsForCategory = (currentPOICountInCategory) => {
    if (!user) return 0;
    const limit = PLAN_LIMITS[user.plan]?.maxPOIsPerCategory || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICountInCategory);
  };
  const value = {
    user,
    login,
    register,
    logout,
    loading,
    upgradePlan,
    canCreatePOI,
    getRemainingPOIs,
    canCreateCategory,
    canAddPOItoCategory,
    canUseCustomIcons,
    getRemainingCategories,
    getRemainingPOIsForCategory,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
