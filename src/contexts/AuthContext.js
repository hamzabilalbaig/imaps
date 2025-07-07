import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data
const USERS = {
  'admin@admin.com': {
    id: 1,
    email: 'admin@admin.com',
    password: '12345678',
    role: 'admin',
    name: 'Admin User',
    plan: 'unlimited'
  },
  'user@user.com': {
    id: 2,
    email: 'user@user.com',
    password: '12345678',
    role: 'user',
    name: 'Regular User',
    plan: 'free'
  }
};

// Plan limits
export const PLAN_LIMITS = {
  free: { maxPOIs: 3 },
  basic: { maxPOIs: 10 },
  premium: { maxPOIs: 50 },
  unlimited: { maxPOIs: Infinity }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, expectedRole = null) => {
    const userData = USERS[email];
    if (userData && userData.password === password) {
      // If expectedRole is specified, validate it matches the user's role
      if (expectedRole && userData.role !== expectedRole) {
        if (expectedRole === 'admin' && userData.role === 'user') {
          return { success: false, error: 'These credentials are for a regular user account. Please use User Login.' };
        } else if (expectedRole === 'user' && userData.role === 'admin') {
          return { success: false, error: 'These credentials are for an admin account. Please use Admin Login.' };
        }
      }
      
      const { password: _, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const register = async (email, password, name, role = 'user') => {
    // Check if user already exists
    if (USERS[email]) {
      return { success: false, error: 'User already exists with this email' };
    }

    // Create new user
    const newUser = {
      id: Object.keys(USERS).length + 1,
      email,
      password,
      role,
      name,
      plan: role === 'admin' ? 'unlimited' : 'free'
    };

    // Add to USERS object (in a real app, this would be sent to a server)
    USERS[email] = newUser;

    // Auto-login the new user
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const upgradePlan = (newPlan) => {
    if (user) {
      const updatedUser = { ...user, plan: newPlan };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const canCreatePOI = (currentPOICount) => {
    if (!user) return false;
    const limit = PLAN_LIMITS[user.plan]?.maxPOIs || 0;
    return currentPOICount < limit;
  };

  const getRemainingPOIs = (currentPOICount) => {
    if (!user) return 0;
    const limit = PLAN_LIMITS[user.plan]?.maxPOIs || 0;
    return limit === Infinity ? Infinity : Math.max(0, limit - currentPOICount);
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
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
