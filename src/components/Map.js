import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import MapClickHandler from "./MapClickHandler";
import MapMarker from "./MapMarker";
import MapControls from "./MapControls";
import { useMapMarkers } from "../hooks/useMapMarkers";
import { MAP_CONFIG } from "../utils/mapUtils";

function InteractiveMap() {
  const { markers, addMarker, removeMarker, clearAllMarkers } = useMapMarkers();

  return (
    <div className="w-full h-full flex flex-col">
      <MapControls markers={markers} onClearAll={clearAllMarkers} />

      <div className="flex-1 relative ">
        <MapContainer
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          className="w-full h-full z-10 "
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          /> */}

          <MapClickHandler onMapClick={addMarker} />

          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              marker={marker}
              onRemove={removeMarker}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default InteractiveMap;
