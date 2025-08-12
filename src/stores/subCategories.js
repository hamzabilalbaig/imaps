import { create } from 'zustand';
import { 
  getAllSubCategories, 
  getSubCategoryById, 
  createSubCategory, 
  updateSubCategoryById 
} from '../api/functions/apiFunctions';

const useSubCategoriesStore = create((set, get) => ({
  // State
  subCategories: [],
  currentSubCategory: null,
  loading: false,
  error: null,

  // Actions
  
  // Initialize subcategories - load from API
  initializeSubCategories: async () => {
    const state = get();
    
    // Don't reload if already loaded
    if (state.subCategories.length > 0) return;
    
    try {
      set({ loading: true, error: null });
      const subCategories = await getAllSubCategories();
      set({ 
        subCategories: subCategories || [],
        loading: false 
      });
    } catch (error) {
      console.error('Error loading subcategories:', error);
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },

  // Fetch all subcategories
  fetchSubCategories: async () => {
    try {
      set({ loading: true, error: null });
      const subCategories = await getAllSubCategories();
      set({ 
        subCategories: subCategories || [],
        loading: false 
      });
      return { success: true, subCategories };
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Fetch a single subcategory by ID
  fetchSubCategoryById: async (id) => {
    try {
      set({ loading: true, error: null });
      const subCategory = await getSubCategoryById(id);
      set({ 
        currentSubCategory: subCategory,
        loading: false 
      });
      return { success: true, subCategory };
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Create a new subcategory
  createSubCategory: async (subCategoryData) => {
    try {
      set({ loading: true, error: null });
      const newSubCategory = await createSubCategory(subCategoryData);
      
      // Add to local state
      const currentSubCategories = get().subCategories;
      set({ 
        subCategories: [...currentSubCategories, newSubCategory],
        loading: false 
      });
      
      return { success: true, subCategory: newSubCategory };
    } catch (error) {
      console.error('Error creating subcategory:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update an existing subcategory
  updateSubCategory: async (id, subCategoryData) => {
    try {
      set({ loading: true, error: null });
      const updatedSubCategory = await updateSubCategoryById(id, subCategoryData);
      
      // Update in local state
      const currentSubCategories = get().subCategories;
      const updatedSubCategories = currentSubCategories.map(subCategory => 
        subCategory.id === id ? updatedSubCategory : subCategory
      );
      
      set({ 
        subCategories: updatedSubCategories,
        currentSubCategory: get().currentSubCategory?.id === id ? updatedSubCategory : get().currentSubCategory,
        loading: false 
      });
      
      return { success: true, subCategory: updatedSubCategory };
    } catch (error) {
      console.error('Error updating subcategory:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Clear current subcategory
  clearCurrentSubCategory: () => {
    set({ currentSubCategory: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Clear all subcategories (useful for logout)
  clearSubCategories: () => {
    set({ 
      subCategories: [],
      currentSubCategory: null,
      error: null 
    });
  },

  // Get subcategory by ID from local state
  getSubCategoryById: (id) => {
    const subCategories = get().subCategories;
    return subCategories.find(subCategory => subCategory.id === id);
  },

  // Get subcategories by category ID
  getSubCategoriesByCategoryId: (categoryId) => {
    const subCategories = get().subCategories;
    return subCategories.filter(subCategory => subCategory.category_id === categoryId);
  },

  // Get subcategories by name pattern (useful for search)
  getSubCategoriesByName: (searchTerm) => {
    const subCategories = get().subCategories;
    return subCategories.filter(subCategory => 
      subCategory.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Check if subcategory name exists within a category (useful for validation)
  subCategoryNameExists: (name, categoryId, excludeId = null) => {
    const subCategories = get().subCategories;
    return subCategories.some(subCategory => 
      subCategory.name.toLowerCase() === name.toLowerCase() && 
      subCategory.category_id === categoryId &&
      subCategory.id !== excludeId
    );
  },

  // Get total subcategories count
  getSubCategoriesCount: () => {
    return get().subCategories.length;
  },

  // Get subcategories count for a specific category
  getSubCategoriesCountByCategory: (categoryId) => {
    const subCategories = get().subCategories;
    return subCategories.filter(subCategory => subCategory.category_id === categoryId).length;
  },

  // Refresh subcategories (force reload)
  refreshSubCategories: async () => {
    set({ subCategories: [] }); // Clear current subcategories
    return get().fetchSubCategories();
  },

  // Get subcategories grouped by category
  getSubCategoriesGroupedByCategory: () => {
    const subCategories = get().subCategories;
    return subCategories.reduce((acc, subCategory) => {
      const categoryId = subCategory.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(subCategory);
      return acc;
    }, {});
  },
}));

export default useSubCategoriesStore;