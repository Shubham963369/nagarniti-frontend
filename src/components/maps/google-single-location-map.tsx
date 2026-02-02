"use client";

import { useEffect, useRef } from "react";

interface GoogleSingleLocationMapProps {
  lat: number;
  lng: number;
  title?: string;
  zoom?: number;
  className?: string;
}

export function GoogleSingleLocationMap({
  lat,
  lng,
  title,
  zoom = 15,
  className = "h-48",
}: GoogleSingleLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps) {
        setTimeout(initMap, 100);
        return;
      }

      const position = { lat, lng };

      googleMapRef.current = new google.maps.Map(mapRef.current!, {
        center: position,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        scrollwheel: false,
        draggable: false,
        disableDoubleClickZoom: true,
        gestureHandling: "none",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      markerRef.current = new google.maps.Marker({
        position: position,
        map: googleMapRef.current,
      });

      if (title) {
        infoWindowRef.current = new google.maps.InfoWindow({
          content: `<div class="p-1 font-medium">${title}</div>`,
        });

        markerRef.current.addListener("click", () => {
          infoWindowRef.current?.open(googleMapRef.current || undefined, markerRef.current || undefined);
        });
      }
    };

    initMap();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [lat, lng, zoom, title]);

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
