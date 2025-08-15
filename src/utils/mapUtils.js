import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { 
  GiForkKnifeSpoon, 
  GiTowerBridge, 
  GiBed, 
  GiShop, 
  GiBus, 
  GiHospital,
  GiGraduateCap, 
  GiTheater, 
  GiPositionMarker,
  GiCoffeeCup,
  GiGreekTemple,
  GiGasPump,
  GiBank,
  GiChurch,
  GiBeachBall,
  GiCaravan
} from 'react-icons/gi';
import useSubCategoriesStore from "../stores/subCategories";
import usePOIsStore from "../stores/pois";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
//   iconRetinaUrl: require("../assets/save.gif"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export const MAP_CONFIG = {
  defaultCenter: [24.9, 67.15], // Centered on the image bounds
  defaultZoom: 12,
  imageBounds: [
    [24.8, 67.0], // Southwest corner
    [25.0, 67.3]  // Northeast corner
  ],
};

/**
 * Safely perform operations on a map instance
 * @param {Object} map - Leaflet map instance
 * @param {Function} operation - Function to execute on the map
 * @param {number} delay - Optional delay in ms
 * @returns {Function} Cleanup function
 */
export const safeMapOperation = (map, operation, delay = 0) => {
  if (!map) return () => {};
  
  const timeoutId = setTimeout(() => {
    try {
      if (map && map._container && map._loaded) {
        operation(map);
      }
    } catch (err) {
      console.log("Map operation error:", err);
    }
  }, delay);
  
  return () => clearTimeout(timeoutId);
};

export const createMarker = (latlng, poiData = {}) => ({
  id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  position: [latlng.lat, latlng.lng],
  coords: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`,
  title: poiData.title || "New POI",
  description: poiData.description || "",
  category: poiData.category || "Other",
  categoryId: poiData.categoryId || null,
  selectedIcon: poiData.selectedIcon  || null,
  customIcon: poiData.customIcon || null,
  iconColor: poiData.iconColor || "#6b7280",
  userId: poiData.userId || null,
  userName: poiData.userName || null,
  userEmail: poiData.userEmail || null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateShareableLink = (poi) => {
  const baseUrl = window.location.origin;
  
  // Support both new POI structure and legacy marker structure
  // New structure has sub_category_id, legacy has category
  const isNewStructure = poi.sub_category_id !== undefined;
  
  let lat, lng, title, category;
  
  if (isNewStructure) {
    // New POI structure
    const position = poi.position || poi.coords;
    lat = position[0];
    lng = position[1];
    title = poi.name || poi.title || 'POI'; // Handle both name and title fields
    category = poi.subcategory_name || 'POI'; // This should be set by the caller
  } else {
    // Legacy marker structure
    lat = poi.position[0];
    lng = poi.position[1];
    title = poi.title;
    category = poi.category;
  }
  
  console.log('generateShareableLink - POI:', poi);
  console.log('generateShareableLink - isNewStructure:', isNewStructure);
  console.log('generateShareableLink - Values:', { lat, lng, title, category });
  
  const params = new URLSearchParams({
    lat: lat,
    lng: lng,
    title: title || 'POI',
    category: category || 'Other'
  });
  return `${baseUrl}/?poi=${encodeURIComponent(params.toString())}`;
};

// Parse POI parameters from URL
export const parsePOIFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const poiParam = urlParams.get('poi');
  
  if (!poiParam) return null;
  
  try {
    console.log('Parsing POI from URL parameter:', poiParam);
    const poiParams = new URLSearchParams(decodeURIComponent(poiParam));
    
    // Extract and parse coordinates
    const lat = parseFloat(poiParams.get('lat'));
    const lng = parseFloat(poiParams.get('lng'));
    const title = poiParams.get('title');
    const category = poiParams.get('category');
    
    console.log('Parsed POI values:', { lat, lng, title, category });
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates in POI URL parameter');
      return null;
    }
    
    return { lat, lng, title, category };
  } catch (error) {
    console.error('Error parsing POI from URL:', error);
    return null;
  }
};

// Category to icon mapping
export const CATEGORY_ICONS = {
  "Restaurant": GiForkKnifeSpoon,
  "Cafe": GiCoffeeCup,
  "Fast Food": GiCaravan,
  "Tourist Attraction": GiTowerBridge,
  "Museum": GiGreekTemple,
  "Hotel": GiBed,
  "Shopping": GiShop,
  "Transportation": GiBus,
  "Gas Station": GiGasPump,
  "Healthcare": GiHospital,
  "Education": GiGraduateCap,
  "Entertainment": GiTheater,
  "Recreation": GiBeachBall,
  "Bank": GiBank,
  "Religious": GiChurch,
  "Other": GiPositionMarker
};

// Category color mapping
export const CATEGORY_COLORS = {
  "Restaurant": "#ef4444",      // Red
  "Cafe": "#8b4513",           // Brown
  "Fast Food": "#ff6b35",      // Orange-red
  "Tourist Attraction": "#3b82f6", // Blue
  "Museum": "#4338ca",         // Indigo
  "Hotel": "#8b5cf6",          // Purple
  "Shopping": "#f59e0b",       // Amber
  "Transportation": "#10b981",  // Emerald
  "Gas Station": "#059669",    // Green
  "Healthcare": "#ec4899",     // Pink
  "Education": "#6366f1",      // Indigo
  "Entertainment": "#f97316",   // Orange
  "Recreation": "#06b6d4",     // Cyan
  "Bank": "#059669",           // Green
  "Religious": "#7c3aed",      // Violet
  "Other": "#6b7280"           // Gray
};

// Utility function to get custom icons from localStorage database
export const getCustomIcons = () => {
  try {
    const { localDB } = require('./localStorage');
    return localDB.getUserCustomIcons();
  } catch (error) {
    console.error('Error loading custom icons from localStorage database:', error);
    return [];
  }
};

// Create custom icon for a category
export const createCategoryIcon = (category, customIcon = null, selectedIcon = null, iconColor = null) => {
  // Use custom icon color if provided, otherwise use category color
  const color = iconColor || CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <img src="${customIcon}" style="width: 24px; height: 24px; object-fit: contain;" alt="${category}" />
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};
