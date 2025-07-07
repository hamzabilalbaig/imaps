import React, { useState, useEffect } from "react";
import { POI_CATEGORIES, getCustomIcons } from "../utils/mapUtils";
import IconSelector from "./IconSelector";

/**
 * Form component for adding or editing POIs
 */
function POIForm({ poi, onSave, onCancel, isEdit = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    customIcon: null,
    selectedIcon: null,
  });
  const [customIcons, setCustomIcons] = useState([]);

  useEffect(() => {
    // Load custom icons from localStorage
    const savedCustomIcons = getCustomIcons();
    setCustomIcons(savedCustomIcons);

    if (poi && isEdit) {
      setFormData({
        title: poi.title || "",
        description: poi.description || "",
        category: poi.category || "Other",
        customIcon: poi.customIcon || null,
        selectedIcon: poi.selectedIcon || null,
      });
    }
  }, [poi, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a title for the POI");
      return;
    }
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconSelect = (iconKey, customIconData = null) => {
    setFormData((prev) => ({
      ...prev,
      selectedIcon: iconKey,
      customIcon: customIconData,
    }));

    // If it's a new custom icon, update the custom icons list
    if (customIconData) {
      setCustomIcons((prev) => {
        const exists = prev.find((icon) => icon.id === customIconData.id);
        if (!exists) {
          return [...prev, customIconData];
        }
        return prev;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit POI" : "Add New POI"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <IconSelector
              selectedIcon={formData.selectedIcon}
              onIconSelect={handleIconSelect}
              customIcons={customIcons}
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter POI title"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter POI description"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {POI_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {poi && (
            <div className="text-sm text-gray-600">
              <p>
                <strong>Location:</strong> {poi.coords}
              </p>
              {isEdit && (
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(poi.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              {isEdit ? "Update POI" : "Add POI"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default POIForm;
