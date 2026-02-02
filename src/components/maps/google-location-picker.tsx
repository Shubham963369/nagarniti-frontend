"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

interface GoogleLocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number } | null) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export function GoogleLocationPicker({
  value,
  onChange,
  center = { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
  zoom = 13,
  className,
}: GoogleLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value || null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps) {
        setTimeout(initMap, 100);
        return;
      }

      const mapCenter = value || center;
      googleMapRef.current = new google.maps.Map(mapRef.current!, {
        center: mapCenter,
        zoom: zoom,
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
          const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setPosition(newPos);
          onChange(newPos);
          updateMarker(newPos);
        }
      });

      // Initialize marker if value exists
      if (value) {
        updateMarker(value);
      }

      setIsMapReady(true);
    };

    initMap();
  }, []);

  // Update marker position
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
  }, []);

  // Sync external value changes
  useEffect(() => {
    setPosition(value || null);
    if (value && googleMapRef.current) {
      updateMarker(value);
      googleMapRef.current.panTo(value);
    } else if (!value && markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [value, updateMarker]);

  // Handle geolocation
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPosition(pos);
        onChange(pos);
        updateMarker(pos);
        googleMapRef.current?.panTo(pos);
        googleMapRef.current?.setZoom(16);
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
    setPosition(null);
    onChange(null);
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  return (
    <div className={className}>
      <div className="relative h-64 rounded-lg overflow-hidden border">
        <div ref={mapRef} className="h-full w-full" />
        {isMapReady && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-3 right-3 z-10"
            onClick={handleLocate}
            disabled={isLocating}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            {isLocating ? "Locating..." : "My Location"}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          {position
            ? `Selected: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
            : "Click on the map to select a location"}
        </p>
        {position && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
