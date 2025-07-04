import { useMapEvents } from "react-leaflet";

/**
 * Component to handle map click events
 * @param {Function} onMapClick - Callback function called when map is clicked
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default MapClickHandler;
