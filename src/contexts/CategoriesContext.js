import React, { createContext, useContext, useState, useEffect } from 'react';
import { CATEGORY_COLORS } from '../utils/mapUtils';
import { localDB } from '../utils/localStorage';

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

  // Load categories from localStorage on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const userCategories = localDB.getUserCategories();
    setCategories(userCategories);
  };

  const addCategory = (categoryData) => {
    const result = localDB.addCategory(categoryData);
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
    return categories.find(category => category.id === categoryId);
  };

  const getCategoryByName = (categoryName) => {
    return categories.find(category => category.name === categoryName);
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

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
    getCategoryNames,
    getCategoryColors,
    loadCategories
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export default CategoriesContext;
