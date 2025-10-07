import { create } from 'zustand';

const useSettingsStore = create((set, get) => ({
  // POI Icon Settings - this will be loaded from DB, not localStorage
  poiIconSize: 40, // Default size in pixels (fallback only)
  
  // Actions
  setPoiIconSize: (size) => {
    // Ensure size is within reasonable bounds
    const clampedSize = Math.max(20, Math.min(80, size));
    set({ poiIconSize: clampedSize });
  },
  
  // Initialize from database value
  initializePoiIconSize: (size) => {
    const clampedSize = Math.max(20, Math.min(80, size));
    set({ poiIconSize: clampedSize });
  },
  
  // Reset to defaults
  resetToDefaults: () => {
    set({
      poiIconSize: 40
    });
  },
}));

export default useSettingsStore;