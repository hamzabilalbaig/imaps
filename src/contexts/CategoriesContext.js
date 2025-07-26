import React, { createContext, useContext, useState, useEffect } from 'react';
import { CATEGORY_COLORS } from '../utils/mapUtils';
import { localDB } from '../utils/localStorage';
import { useAuth } from './AuthContext';

const CategoriesContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const { user, canCreateCategory } = useAuth();

  // Load categories from localStorage on mount
  useEffect(() => {
    if (user) { // Only load categories if a user is logged in
      loadCategories();
    } else {
      setCategories([]); // Clear categories if no user is logged in
    }
  }, [user]); // Add user to dependency array

  const loadCategories = async () => {
    // This method already calls localDB.getAvailableCategories(),
    // which now correctly returns categories based on user role.
    const userCategories = await localDB.getAvailableCategories();
    setCategories(userCategories);
  };

  const addCategory = async (categoryData) => {
    // Check if user can create more categories
    const currentCategoryCount = localDB?.getUserCategoryCount();
    if (!canCreateCategory(currentCategoryCount)) {
      throw new Error('You have reached your category limit. Upgrade your plan to create more categories.');
    }

    const result = await localDB?.addCategory(categoryData);
    // const result = { success: true, category: categoryData };
    if (result.success) {
      loadCategories(); // Reload categories from localStorage
      return result.category;
    }
    throw new Error(result.message);
  };

  const updateCategory = (categoryId, updates) => {
    const result = localDB.updateCategory(categoryId, updates);
    if (result.success) {
      loadCategories(); // Reload categories from localStorage
      return result.category;
    }
    throw new Error(result.message);
  };

  const deleteCategory = (categoryId) => {
    const result = localDB.deleteCategory(categoryId);
    if (result.success) {
      loadCategories(); // Reload categories from localStorage
      return true;
    }
    throw new Error(result.message);
  };

  const getCategoryById = (categoryId) => {
    return categories?.find(category => category.id === categoryId);
  };

  const getCategoryByName = (categoryName) => {
    return categories?.find(category => category.name === categoryName);
  };

  const getCategoryNames = () => {
     return categories.map(category => category.name);
  };

  const getCategoryColors = () => {
    const colorMap = {};
    categories.forEach(category => {
      colorMap[category.name] = category.color;
    });
    return colorMap;
  };

  const getUserCategoryCount = () => {
    return localDB.getUserCategoryCount();
  };
  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
    getCategoryNames,
    getCategoryColors,
    loadCategories,
    getUserCategoryCount
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export default CategoriesContext;
