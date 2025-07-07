import React, { useState, useRef } from "react";
import { CATEGORY_ICONS, getCustomIcons } from "../utils/mapUtils";
import { FiPlus, FiX } from "react-icons/fi";

/**
 * Icon selector component for POI forms
 */
function IconSelector({ selectedIcon, onIconSelect, customIcons = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef(null);

  // Get all available icons (built-in + custom)
  const builtInIcons = Object.keys(CATEGORY_ICONS);
  const allIcons = [...builtInIcons, ...customIcons.map(icon => icon.id)];

  const handleIconClick = (iconKey) => {
    // Check if it's a custom icon
    const customIcon = customIcons.find(icon => icon.id === iconKey);
    onIconSelect(iconKey, customIcon);
    setIsOpen(false);
    setShowUpload(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PNG, SVG, JPG, or JPEG file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const customIcon = {
        id: `custom_${Date.now()}`,
        name: file.name.split('.')[0],
        data: e.target.result,
        type: file.type
      };
      
      // Save to localStorage for persistence
      const savedCustomIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
      savedCustomIcons.push(customIcon);
      localStorage.setItem('customIcons', JSON.stringify(savedCustomIcons));
      
      onIconSelect(customIcon.id, customIcon);
      setIsOpen(false);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const renderIcon = (iconKey, size = 24) => {
    // Check if it's a custom icon
    const customIcon = customIcons.find(icon => icon.id === iconKey);
    if (customIcon) {
      return (
        <img 
          src={customIcon.data} 
          alt={customIcon.name}
          style={{ width: size, height: size }}
          className="object-contain"
        />
      );
    }

    // Built-in icon
    const IconComponent = CATEGORY_ICONS[iconKey];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }

    // Fallback
    return <div style={{ width: size, height: size }} className="bg-gray-300 rounded" />;
  };

  const getSelectedIconDisplay = () => {
    if (!selectedIcon) return "Select Icon";
    
    const customIcon = customIcons.find(icon => icon.id === selectedIcon);
    if (customIcon) {
      return customIcon.name || "Custom Icon";
    }
    
    return selectedIcon;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Icon
      </label>
      
      {/* Icon selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          {selectedIcon && (
            <div className="w-6 h-6 flex items-center justify-center">
              {renderIcon(selectedIcon, 20)}
            </div>
          )}
          <span className="text-sm text-gray-700">
            {getSelectedIconDisplay()}
          </span>
        </div>
        <div className="text-gray-400">
          {isOpen ? "▲" : "▼"}
        </div>
      </button>

      {/* Icon grid dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-3">
            <div className="grid grid-cols-6 gap-2">
              {/* Add custom icon button */}
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                title="Add custom icon"
              >
                <FiPlus size={20} className="text-gray-400" />
              </button>

              {/* Built-in icons */}
              {builtInIcons.map((iconKey) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => handleIconClick(iconKey)}
                  className={`w-10 h-10 border rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors ${
                    selectedIcon === iconKey ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  title={iconKey}
                >
                  {renderIcon(iconKey, 20)}
                </button>
              ))}

              {/* Custom icons */}
              {customIcons.map((customIcon) => (
                <button
                  key={customIcon.id}
                  type="button"
                  onClick={() => handleIconClick(customIcon.id)}
                  className={`w-10 h-10 border rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors ${
                    selectedIcon === customIcon.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  title={customIcon.name}
                >
                  {renderIcon(customIcon.id, 20)}
                </button>
              ))}
            </div>

            {/* File upload section */}
            {showUpload && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Upload custom icon (PNG, SVG, JPG, JPEG - max 2MB)
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Choose File
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IconSelector;
