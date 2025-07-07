import React, { useState } from "react";
import { POI_CATEGORIES, generateShareableLink } from "../utils/mapUtils";

/**
 * Component for listing and managing POIs in admin panel
 */
function POIList({ markers, onEdit, onRemove, onClearAll }) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMarkers = markers.filter(marker => {
    const matchesCategory = filterCategory === "All" || marker.category === filterCategory;
    const matchesSearch = !searchTerm || 
      marker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marker.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleShare = async (marker) => {
    const shareableLink = generateShareableLink(marker);
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert("Shareable link copied to clipboard!");
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Shareable link copied to clipboard!");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Restaurant": "bg-red-100 text-red-800",
      "Tourist Attraction": "bg-blue-100 text-blue-800",
      "Hotel": "bg-purple-100 text-purple-800",
      "Shopping": "bg-green-100 text-green-800",
      "Transportation": "bg-yellow-100 text-yellow-800",
      "Healthcare": "bg-pink-100 text-pink-800",
      "Education": "bg-indigo-100 text-indigo-800",
      "Entertainment": "bg-orange-100 text-orange-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors["Other"];
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            POI Management ({markers.length})
          </h2>
          <button
            onClick={onClearAll}
            disabled={markers.length === 0}
            className={`px-3 py-1 text-sm font-medium rounded ${
              markers.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            Clear All
          </button>
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search POIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {POI_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredMarkers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {markers.length === 0 ? "No POIs added yet" : "No POIs match your filters"}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredMarkers.map((marker) => (
              <div
                key={marker.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {marker.title || "Untitled POI"}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(marker.category)}`}>
                    {marker.category}
                  </span>
                </div>

                {marker.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {marker.description}
                  </p>
                )}

                <p className="text-xs text-gray-500 mb-3">
                  {marker.coords}
                </p>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handleShare(marker)}
                    className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    title="Share POI"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => onEdit(marker)}
                    className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    title="Edit POI"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemove(marker.id)}
                    className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    title="Delete POI"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default POIList;
