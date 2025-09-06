import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDB } from '../utils/localStorage';
import { authenticateUser } from '../api/functions/apiFunctions';
import { fetchPlanLimits } from '../utils/planLimits';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLimits, setPlanLimits] = useState(null);

  useEffect(() => {
    // Load plan limits when component mounts
    const loadPlanLimits = async () => {
      try {
        const limits = await fetchPlanLimits();
        setPlanLimits(limits);
      } catch (error) {
        console.error('Failed to load plan limits:', error);
      }
    };
    
    loadPlanLimits();

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
    if (!user || !planLimits) return false;
    const limit = planLimits[user.plan]?.totalPOILimit || 0;

    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;

    return totalPoisCount < limit;
  };

  const getRemainingPOIs = async () => {
    if (!user || !planLimits) return 0;
    const limit = planLimits[user.plan]?.totalPOILimit || 0;
    
    if (limit === Infinity) return Infinity;
    
    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;
    
    return Math.max(0, limit - totalPoisCount);
  };

  const canCreateCategory = (currentCategoryCount) => {
    if (!user || !planLimits) return false;
    const limit = planLimits[user.plan]?.maxCustomCategories || 0;
    return limit === Infinity || currentCategoryCount < limit;
  };

  const canAddPOI = async () => {
    if (!user || !planLimits) return false;
    const limit = planLimits[user.plan]?.totalPOILimit || 0;

    const userPois = await localDB.getUserPOIs();
    const totalPoisCount = userPois.length;

    if (limit === Infinity) {
      return true;
    }
    
    return totalPoisCount < limit;
  };

  const canUseCustomIcons = () => {
    if (!user || !planLimits) return false;
    return planLimits[user.plan]?.allowCustomIcons || false;
  };

  const getRemainingCategories = (currentCategoryCount) => {
    if (!user || !planLimits) return 0;
    const limit = planLimits[user.plan]?.maxCustomCategories || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentCategoryCount);
  };

  const refreshPlanLimits = async () => {
    try {
      const limits = await fetchPlanLimits();
      setPlanLimits(limits);
    } catch (error) {
      console.error('Failed to refresh plan limits:', error);
    }
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
    refreshPlanLimits,
    planLimits,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
