import { useState, useEffect } from 'react';
import { localDB } from '../utils/localStorage';

export function usePublicMapData() {
  const [markers, setMarkers] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load admin POIs
      const adminPois = await localDB.getAdminPOIs();
      setMarkers(adminPois || []);

      // Load admin categories
      const adminCategories = JSON.parse(localStorage.getItem('imaps_admin_categories') || '[]');
      setCategories(adminCategories || []);
    }
    loadData();
  }, []);

  return {
    markers,
    categories,
  };
}
