import { create } from 'zustand';
import { getPOISetting, updatePOISetting, createPOISetting } from '../api/functions/apiFunctions';

const useSettingsStore = create((set, get) => ({
  // POI Icon Settings
  poiIconSize: 40, // Default size in pixels
  loading: false,
  error: null,
  initialized: false,
  
  // Actions
  initializeSettings: async () => {
    if (get().initialized) return; // Already initialized
    
    try {
      set({ loading: true, error: null });
      
      // Try to get the POI icon size setting from database
      const iconSizeSetting = await getPOISetting('poi_icon_size');
      const iconSize = parseInt(iconSizeSetting.setting_value) || 40;
      
      set({ 
        poiIconSize: iconSize,
        initialized: true,
        loading: false 
      });
    } catch (error) {
      console.error('Error initializing POI settings:', error);
      // If setting doesn't exist, create it with default value
      try {
        await createPOISetting('poi_icon_size', '40', 'Global POI icon size in pixels (20-80)');
        set({ 
          poiIconSize: 40,
          initialized: true,
          loading: false 
        });
      } catch (createError) {
        console.error('Error creating default POI settings:', createError);
        set({ 
          error: 'Failed to initialize settings',
          loading: false,
          initialized: true // Still mark as initialized to prevent infinite retries
        });
      }
    }
  },
  
  setPoiIconSize: async (size) => {
    // Ensure size is within reasonable bounds
    const clampedSize = Math.max(20, Math.min(80, size));
    
    try {
      set({ loading: true, error: null });
      
      // Update in database
      await updatePOISetting('poi_icon_size', clampedSize.toString());
      
      // Update local state
      set({ 
        poiIconSize: clampedSize,
        loading: false 
      });
    } catch (error) {
      console.error('Error updating POI icon size:', error);
      set({ 
        error: 'Failed to update icon size',
        loading: false 
      });
      
      // Revert to previous value on error
      throw error;
    }
  },
  
  // Reset to defaults
  resetToDefaults: async () => {
    try {
      set({ loading: true, error: null });
      
      await updatePOISetting('poi_icon_size', '40');
      
      set({
        poiIconSize: 40,
        loading: false
      });
    } catch (error) {
      console.error('Error resetting POI settings:', error);
      set({ 
        error: 'Failed to reset settings',
        loading: false 
      });
      throw error;
    }
  },
}));

export default useSettingsStore;