import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // POI Icon Settings
      poiIconSize: 40, // Default size in pixels
      
      // Actions
      setPoiIconSize: (size) => {
        // Ensure size is within reasonable bounds
        const clampedSize = Math.max(20, Math.min(80, size));
        set({ poiIconSize: clampedSize });
      },
      
      // Reset to defaults
      resetToDefaults: () => {
        set({
          poiIconSize: 40
        });
      },
    }),
    {
      name: 'imaps-settings', // Storage key
      version: 1,
    }
  )
);

export default useSettingsStore;