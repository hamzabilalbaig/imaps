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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
//   iconRetinaUrl: require("../assets/save.gif"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export const MAP_CONFIG = {
  defaultCenter: [24.917037, 67.131161],
  defaultZoom: 80,
};

export const POI_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Fast Food",
  "Tourist Attraction", 
  "Museum",
  "Hotel",
  "Shopping",
  "Transportation",
  "Gas Station",
  "Healthcare",
  "Education",
  "Entertainment",
  "Recreation",
  "Bank",
  "Religious",
  "Other"
];

export const createMarker = (latlng, poiData = {}) => ({
  id: Date.now(),
  position: [latlng.lat, latlng.lng],
  coords: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`,
  title: poiData.title || "New POI",
  description: poiData.description || "",
  category: poiData.category || "Other",
  selectedIcon: poiData.selectedIcon || null,
  customIcon: poiData.customIcon || null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateShareableLink = (poi) => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    lat: poi.position[0],
    lng: poi.position[1],
    title: poi.title,
    category: poi.category
  });
  return `${baseUrl}/?poi=${encodeURIComponent(params.toString())}`;
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

// Utility function to get custom icons from localStorage
export const getCustomIcons = () => {
  try {
    return JSON.parse(localStorage.getItem('customIcons') || '[]');
  } catch (error) {
    console.error('Error loading custom icons from localStorage:', error);
    return [];
  }
};

// Create custom icon for a category
export const createCategoryIcon = (category, customIcon = null, selectedIcon = null) => {
  let IconComponent;
  let iconHtml;
  
  // Check if we should use a custom icon
  if (selectedIcon && customIcon) {
    // Use custom uploaded icon
    iconHtml = `<img src="${customIcon.data}" style="width: 24px; height: 24px; object-fit: contain;" alt="${customIcon.name}" />`;
  } else if (selectedIcon && selectedIcon.startsWith('custom_')) {
    // Try to find custom icon in localStorage
    const customIcons = getCustomIcons();
    const foundCustomIcon = customIcons.find(icon => icon.id === selectedIcon);
    if (foundCustomIcon) {
      iconHtml = `<img src="${foundCustomIcon.data}" style="width: 24px; height: 24px; object-fit: contain;" alt="${foundCustomIcon.name}" />`;
    } else {
      // Fallback to category-based icon if custom icon not found
      IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS["Other"];
      iconHtml = ReactDOMServer.renderToString(
        React.createElement(IconComponent, {
          size: 24,
          color: "white"
        })
      );
    }
  } else if (selectedIcon && CATEGORY_ICONS[selectedIcon]) {
    // Use selected built-in icon
    IconComponent = CATEGORY_ICONS[selectedIcon];
    iconHtml = ReactDOMServer.renderToString(
      React.createElement(IconComponent, {
        size: 24,
        color: "white"
      })
    );
  } else {
    // Fallback to category-based icon
    IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS["Other"];
    iconHtml = ReactDOMServer.renderToString(
      React.createElement(IconComponent, {
        size: 24,
        color: "white"
      })
    );
  }
  
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
  
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
        ${iconHtml}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};
