import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export const MAP_CONFIG = {
  defaultCenter: [24.917037, 67.131161],
  defaultZoom: 13,
};

export const createMarker = (latlng) => ({
  id: Date.now(),
  position: [latlng.lat, latlng.lng],
  coords: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`,
});
