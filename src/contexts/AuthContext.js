import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDB } from '../utils/localStorage';
import { authenticateUser } from '../api/functions/apiFunctions';

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
    totalPOILimit: 100,
    allowCustomIcons: false
  },
  premium: { 
    maxCustomCategories: 20,
    totalPOILimit: 400,
    allowCustomIcons: false
  },
  unlimited: { 
    maxCustomCategories: Infinity,
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
    const result = await localDB.loginUser(email, password);
    if (result.success) {
      // If expectedRole is specified, validate it matches the user's role
      if (expectedRole && result.user.role !== expectedRole) {
        if (expectedRole === 'admin' && result.user.role === 'user') {
          return { success: false, error: 'These credentials are for a regular user account. Please use User Login.' };
        } else if (expectedRole === 'user' && result.user.role === 'admin') {
          return { success: false, error: 'Invalid credentials.' };
        }
      }
      
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.message === 'Request failed with status code 401' ? 'Invalid Credentials' : result.message};
  };

  const register = async (email, password, name, role = 'user', navigate) => {
    try {
      // First attempt to register the user
      const result = await localDB.registerUser(email, password, name);
      if (!result.success) {
        return result; // Return failure with the error message
      }
      
      // Registration successful - don't auto-login anymore
      // Just return success
      return { success: true };
      
      // Note: We've removed the auto-login logic because it was causing confusion
      // The user will now need to explicitly log in after registration
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
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

  const canCreatePOI = async () => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.totalPOILimit || 0;

    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;

    return totalPoisCount < limit;
  };

  const getRemainingPOIs = async () => {
    if (!user) return 0;
    const limit = PLAN_LIMITS[user.plan]?.totalPOILimit || 0;
    
    if (limit === Infinity) return Infinity;
    
    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;
    
    return Math.max(0, limit - totalPoisCount);
  };

  const canCreateCategory = (currentCategoryCount) => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.maxCustomCategories || 0;
    return limit === Infinity || currentCategoryCount < limit;
  };

  const canAddPOI = async () => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.totalPOILimit || 0;

    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;

    if (limit === Infinity) {
      return true;
    }
    
    return totalPoisCount < limit;
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
    canAddPOI,
    canUseCustomIcons,
    getRemainingCategories,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
