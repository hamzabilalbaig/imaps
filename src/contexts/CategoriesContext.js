import React, { createContext, useContext, useState, useEffect } from 'react';
import { CATEGORY_COLORS } from '../utils/mapUtils';

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
    const savedCategories = localStorage.getItem('customCategories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
        // Fallback to default categories
        initializeDefaultCategories();
      }
    } else {
      // Initialize with default categories if none exist
      initializeDefaultCategories();
    }
  }, []);

  const initializeDefaultCategories = () => {
    // Start with empty categories - admin will create all categories
    const emptyCategories = [];
    
    setCategories(emptyCategories);
    localStorage.setItem('customCategories', JSON.stringify(emptyCategories));
  };

  const saveCategoriesToStorage = (updatedCategories) => {
    localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
  };

  const addCategory = (categoryData) => {
    const newCategory = {
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: categoryData.name,
      color: categoryData.color || CATEGORY_COLORS['Other'],
      selectedIcon: categoryData.selectedIcon || null,
      customIcon: categoryData.customIcon || null,
      description: categoryData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
    return newCategory;
  };

  const updateCategory = (categoryId, updates) => {
    const updatedCategories = categories.map(category => 
      category.id === categoryId 
        ? { 
            ...category, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          }
        : category
    );
    
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
    return updatedCategories.find(cat => cat.id === categoryId);
  };

  const deleteCategory = (categoryId) => {
    const updatedCategories = categories.filter(category => category.id !== categoryId);
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
    return categories.find(cat => cat.id === categoryId);
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
    getCategoryColors
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export default CategoriesContext;
