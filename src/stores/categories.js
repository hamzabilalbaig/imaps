import { create } from 'zustand';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategoryById 
} from '../api/functions/apiFunctions';

const useCategoriesStore = create((set, get) => ({
  // State
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,

  // Actions
  
  // Initialize categories - load from API
  initializeCategories: async () => {
    const state = get();
    
    // Don't reload if already loaded
    if (state.categories.length > 0) return;
    
    try {
      set({ loading: true, error: null });
      const categories = await getAllCategories();
      set({ 
        categories: categories || [],
        loading: false 
      });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },

  // Fetch all categories
  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const categories = await getAllCategories();
      set({ 
        categories: categories || [],
        loading: false 
      });
      return { success: true, categories };
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Fetch a single category by ID
  fetchCategoryById: async (id) => {
    try {
      set({ loading: true, error: null });
      const category = await getCategoryById(id);
      set({ 
        currentCategory: category,
        loading: false 
      });
      return { success: true, category };
    } catch (error) {
      console.error('Error fetching category:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      set({ loading: true, error: null });
      const newCategory = await createCategory(categoryData);
      
      // Add to local state
      const currentCategories = get().categories;
      set({ 
        categories: [...currentCategories, newCategory],
        loading: false 
      });
      
      return { success: true, category: newCategory };
    } catch (error) {
      console.error('Error creating category:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update an existing category
  updateCategory: async (id, categoryData) => {
    try {
      set({ loading: true, error: null });
      const updatedCategory = await updateCategoryById(id, categoryData);
      
      // Update in local state
      const currentCategories = get().categories;
      const updatedCategories = currentCategories.map(category => 
        category.id === id ? updatedCategory : category
      );
      
      set({ 
        categories: updatedCategories,
        currentCategory: get().currentCategory?.id === id ? updatedCategory : get().currentCategory,
        loading: false 
      });
      
      return { success: true, category: updatedCategory };
    } catch (error) {
      console.error('Error updating category:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Clear current category
  clearCurrentCategory: () => {
    set({ currentCategory: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Clear all categories (useful for logout)
  clearCategories: () => {
    set({ 
      categories: [],
      currentCategory: null,
      error: null 
    });
  },

  // Get category by ID from local state
  getCategoryById: (id) => {
    const categories = get().categories;
    return categories.find(category => category.id === id);
  },

  // Get categories by name pattern (useful for search)
  getCategoriesByName: (searchTerm) => {
    const categories = get().categories;
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Check if category name exists (useful for validation)
  categoryNameExists: (name, excludeId = null) => {
    const categories = get().categories;
    return categories.some(category => 
      category.name.toLowerCase() === name.toLowerCase() && 
      category.id !== excludeId
    );
  },

  // Get total categories count
  getCategoriesCount: () => {
    return get().categories.length;
  },

  // Refresh categories (force reload)
  refreshCategories: async () => {
    set({ categories: [] }); // Clear current categories
    return get().fetchCategories();
  },
}));

export default useCategoriesStore;