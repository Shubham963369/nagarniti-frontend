"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number } | null) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

function LocateButton({ onLocate }: { onLocate: (pos: { lat: number; lng: number }) => void }) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    map.once("locationfound", (e) => {
      onLocate({ lat: e.latlng.lat, lng: e.latlng.lng });
      setIsLocating(false);
    });
    map.once("locationerror", () => {
      setIsLocating(false);
      alert("Could not get your location. Please check your browser permissions.");
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="absolute bottom-3 right-3 z-[1000]"
      onClick={handleLocate}
      disabled={isLocating}
    >
      <Crosshair className="h-4 w-4 mr-1" />
      {isLocating ? "Locating..." : "My Location"}
    </Button>
  );
}

export function LocationPicker({
  value,
  onChange,
  center = { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
  zoom = 13,
  className,
}: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value || null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setPosition(value || null);
  }, [value]);

  const handlePositionChange = (pos: { lat: number; lng: number }) => {
    setPosition(pos);
    onChange(pos);
  };

  const handleClearLocation = () => {
    setPosition(null);
    onChange(null);
  };

  return (
    <div className={className}>
      <div className="relative h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={[value?.lat || center.lat, value?.lng || center.lng]}
          zoom={zoom}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
          <LocateButton onLocate={handlePositionChange} />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          {position
            ? `Selected: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
            : "Click on the map to select a location"}
        </p>
        {position && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClearLocation}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
