import React from "react";
import { Marker, Popup } from "react-leaflet";
import { generateShareableLink, createCategoryIcon } from "../utils/mapUtils";

/**
 * Individual marker component with popup
 * @param {Object} marker - Marker data object
 * @param {Function} onRemove - Callback function to remove the marker
 * @param {Function} onEdit - Callback function to edit the marker
 * @param {boolean} isAdmin - Whether this is admin view with edit capabilities
 */
function MapMarker({ marker, onRemove, onEdit, isAdmin = false }) {
  const handleShare = async () => {
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
      "Cafe": "bg-amber-100 text-amber-800",
      "Fast Food": "bg-orange-100 text-orange-800",
      "Tourist Attraction": "bg-blue-100 text-blue-800",
      "Museum": "bg-indigo-100 text-indigo-800",
      "Hotel": "bg-purple-100 text-purple-800",
      "Shopping": "bg-green-100 text-green-800",
      "Transportation": "bg-yellow-100 text-yellow-800",
      "Gas Station": "bg-green-100 text-green-800",
      "Healthcare": "bg-pink-100 text-pink-800",
      "Education": "bg-indigo-100 text-indigo-800",
      "Entertainment": "bg-orange-100 text-orange-800",
      "Recreation": "bg-cyan-100 text-cyan-800",
      "Bank": "bg-green-100 text-green-800",
      "Religious": "bg-violet-100 text-violet-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors["Other"];
  };

  return (
    <Marker 
      key={marker.id} 
      position={marker.position}
      icon={createCategoryIcon(marker.category)}
    >
      <Popup className="custom-popup">
        <div className="min-w-64">
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {marker.title || "Untitled POI"}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(marker.category)}`}>
              {marker.category}
            </span>
          </div>
          
          {marker.description && (
            <p className="text-sm text-gray-600 mb-3">
              {marker.description}
            </p>
          )}
          
          <div className="text-xs text-gray-500 mb-3">
            <p><strong>Location:</strong> {marker.coords}</p>
            {marker.createdAt && (
              <p><strong>Added:</strong> {new Date(marker.createdAt).toLocaleDateString()}</p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={handleShare}
              className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Link
            </button>
            
            {isAdmin && (
              <div className="flex space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(marker)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(marker.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
