"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Search, X } from "lucide-react";

interface GoogleAddressLocationPickerProps {
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

export function GoogleAddressLocationPicker({
  address,
  onAddressChange,
  location,
  onLocationChange,
  center = { lat: 19.076, lng: 72.8777 },
  zoom = 13,
  className,
}: GoogleAddressLocationPickerProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position
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

  // Initialize Google services and map
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.maps?.places) {
        setTimeout(initGoogle, 100);
        return;
      }

      autocompleteService.current = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
      geocoder.current = new google.maps.Geocoder();
      setIsGoogleReady(true);

      // Initialize map
      if (mapRef.current && !googleMapRef.current) {
        const mapCenter = location || center;
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: location ? 16 : zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Add click listener
        googleMapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            handleMapClick(pos);
          }
        });

        // Add initial marker if location exists
        if (location) {
          updateMarker(location);
        }
      }
    };

    initGoogle();
  }, []);

  // Update marker
  const updateMarker = useCallback((pos: { lat: number; lng: number }) => {
    if (!googleMapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map: googleMapRef.current,
        animation: google.maps.Animation.DROP,
      });
    }
    googleMapRef.current.panTo(pos);
  }, []);

  // Handle map click with reverse geocoding
  const handleMapClick = async (pos: { lat: number; lng: number }) => {
    onLocationChange(pos);
    updateMarker(pos);

    if (geocoder.current) {
      try {
        const response = await geocoder.current.geocode({ location: pos });
        if (response.results?.[0]) {
          onAddressChange(response.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      }
    }
  };

  // Handle clicks outside dropdown
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

  // Fetch predictions
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    updateDropdownPosition();
    setIsSearching(true);

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "in" },
      },
      (results, status) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.map((r) => ({ place_id: r.place_id, description: r.description })));
          updateDropdownPosition();
          setShowPredictions(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, [updateDropdownPosition]);

  // Debounced search
  useEffect(() => {
    if (!isGoogleReady) return;

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
          const pos = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          onAddressChange(place.formatted_address || description);
          onLocationChange(pos);
          updateMarker(pos);
          googleMapRef.current?.setZoom(16);
          setShowPredictions(false);
        }
      }
    );
  };

  // Handle geolocation
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onLocationChange(pos);
        updateMarker(pos);
        googleMapRef.current?.setZoom(16);

        // Reverse geocode
        if (geocoder.current) {
          try {
            const response = await geocoder.current.geocode({ location: pos });
            if (response.results?.[0]) {
              onAddressChange(response.results[0].formatted_address);
            }
          } catch (error) {
            console.error("Geocoding failed:", error);
          }
        }
        setIsLocating(false);
      },
      () => {
        alert("Could not get your location. Please check your browser permissions.");
        setIsLocating(false);
      }
    );
  };

  // Handle clear
  const handleClear = () => {
    onAddressChange("");
    onLocationChange(null);
    setPredictions([]);
    setShowPredictions(false);
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
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

        {/* Predictions Dropdown */}
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
        <div ref={mapRef} className="h-full w-full" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3 z-10"
          onClick={handleLocate}
          disabled={isLocating}
        >
          <Crosshair className="h-4 w-4 mr-1" />
          {isLocating ? "..." : "My Location"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        {location
          ? `Selected: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
          : "Search for an address or click on the map"}
      </p>
    </div>
  );
}
