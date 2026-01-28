"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Search, X } from "lucide-react";
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

interface AddressLocationPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number } | null) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
}

// Component to handle map click events
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Component to handle map center updates
function MapCenterUpdater({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 16);
    }
  }, [center, map]);

  return null;
}

// Component for locate button
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
      {isLocating ? "..." : "My Location"}
    </Button>
  );
}

export function AddressLocationPicker({
  address,
  onAddressChange,
  location,
  onLocationChange,
  center = { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
  zoom = 13,
  className,
}: AddressLocationPickerProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when input focus changes or window resizes
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Initialize Google Places services - with retry until available
  useEffect(() => {
    const initGoogleServices = () => {
      if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (it requires a map or div element)
        const dummyDiv = document.createElement("div");
        placesService.current = new google.maps.places.PlacesService(dummyDiv);
        setIsGoogleReady(true);
        console.log("Google Places API initialized successfully");
        return true;
      }
      return false;
    };

    // Try immediately
    if (initGoogleServices()) return;

    // If not ready, poll every 100ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts++;
      if (initGoogleServices() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error("Google Places API failed to load after 10 seconds");
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position on resize/scroll
  useEffect(() => {
    if (showPredictions || isSearching) {
      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
      return () => {
        window.removeEventListener("resize", updateDropdownPosition);
        window.removeEventListener("scroll", updateDropdownPosition, true);
      };
    }
  }, [showPredictions, isSearching, updateDropdownPosition]);

  // Fetch predictions when address changes
  const fetchPredictions = useCallback((input: string) => {
    console.log("fetchPredictions called with:", input, "isGoogleReady:", isGoogleReady, "autocompleteService:", !!autocompleteService.current);

    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    // Update position before showing loading state
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsSearching(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "in" }, // Restrict to India
      },
      (results, status) => {
        console.log("getPlacePredictions response - status:", status, "results:", results?.length);
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mapped = results.map((r) => ({ place_id: r.place_id, description: r.description }));
          console.log("Setting predictions:", mapped);
          setPredictions(mapped);
          // Update position before showing dropdown
          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
            });
          }
          setShowPredictions(true);
        } else {
          console.log("No results or error status:", status);
          setPredictions([]);
        }
      }
    );
  }, [isGoogleReady]);

  // Debounced search
  useEffect(() => {
    if (!isGoogleReady) {
      console.log("Waiting for Google API to be ready...");
      return;
    }

    const timer = setTimeout(() => {
      if (address && address.length >= 3) {
        fetchPredictions(address);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [address, fetchPredictions, isGoogleReady]);

  // Handle place selection
  const handlePlaceSelect = (placeId: string, description: string) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId, fields: ["geometry", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          onAddressChange(place.formatted_address || description);
          onLocationChange({ lat, lng });
          setShowPredictions(false);
        }
      }
    );
  };

  // Handle map click - reverse geocode to get address
  const handleMapClick = async (pos: { lat: number; lng: number }) => {
    onLocationChange(pos);

    // Try to reverse geocode
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      const geocoder = new google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: { lat: pos.lat, lng: pos.lng } });
        if (response.results && response.results[0]) {
          onAddressChange(response.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      }
    }
  };

  const handleClear = () => {
    onAddressChange("");
    onLocationChange(null);
    setPredictions([]);
    setShowPredictions(false);
  };

  return (
    <div className={className}>
      {/* Address Input with Autocomplete */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Search for an address..."
            className="pl-10 pr-10"
          />
          {(address || location) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Predictions Dropdown - using Portal to escape overflow:hidden */}
        {showPredictions && predictions.length > 0 && dropdownPosition && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
              className="z-[9999] bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-start gap-2"
                  onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                >
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <span>{prediction.description}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        }

        {isSearching && dropdownPosition && typeof document !== "undefined" &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
              className="z-[9999] bg-white dark:bg-gray-900 border rounded-md shadow-lg p-3 text-sm text-muted-foreground"
            >
              Searching...
            </div>,
            document.body
          )
        }
      </div>

      {/* Map */}
      <div className="relative h-48 rounded-lg overflow-hidden border">
        <MapContainer
          center={[location?.lat || center.lat, location?.lng || center.lng]}
          zoom={zoom}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && <Marker position={[location.lat, location.lng]} />}
          <MapClickHandler onLocationSelect={handleMapClick} />
          <MapCenterUpdater center={location} />
          <LocateButton onLocate={handleMapClick} />
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        {location
          ? `Selected: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
          : "Search for an address or click on the map"}
      </p>
    </div>
  );
}
