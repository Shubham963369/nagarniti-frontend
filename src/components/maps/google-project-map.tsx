"use client";

import { useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatCurrency } from "@/lib/utils";

// Status colors for markers
const STATUS_COLORS: Record<string, string> = {
  proposed: "#3b82f6", // blue
  approved: "#8b5cf6", // purple
  in_progress: "#eab308", // yellow
  completed: "#22c55e", // green
  cancelled: "#ef4444", // red
  default: "#6b7280", // gray
};

interface Project {
  id: number;
  title: string;
  status: string;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  estimatedCost?: number | string | null;
  percentComplete?: number;
  fundSource?: string;
}

interface GoogleProjectMapProps {
  projects: Project[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onProjectClick?: (project: Project) => void;
}

export function GoogleProjectMap({
  projects,
  center = { lat: 19.076, lng: 72.8777 },
  zoom = 13,
  className = "h-96",
  onProjectClick,
}: GoogleProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Filter projects with valid coordinates
  const projectsWithLocation = projects.filter(
    (p) => p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
  );

  // Calculate center from projects
  const getMapCenter = useCallback(() => {
    if (projectsWithLocation.length > 0) {
      const latSum = projectsWithLocation.reduce((sum, p) => sum + Number(p.latitude), 0);
      const lngSum = projectsWithLocation.reduce((sum, p) => sum + Number(p.longitude), 0);
      return {
        lat: latSum / projectsWithLocation.length,
        lng: lngSum / projectsWithLocation.length,
      };
    }
    return center;
  }, [projectsWithLocation, center]);

  // Create custom marker icon
  const createMarkerIcon = (status: string) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.default;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
      scale: 12,
    };
  };

  // Create info window content
  const createInfoContent = (project: Project) => {
    const statusLabel = project.status.replace("_", " ");
    const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.default;

    return `
      <div style="min-width: 200px; padding: 8px;">
        <h3 style="font-weight: 600; margin-bottom: 8px;">${project.title}</h3>
        <div style="margin-bottom: 8px;">
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            background-color: ${statusColor}20;
            color: ${statusColor};
            font-weight: 500;
          ">${statusLabel}</span>
        </div>
        ${project.location ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">${project.location}</p>` : ""}
        ${project.estimatedCost ? `<p style="font-size: 12px; margin-bottom: 4px;"><span style="color: #888;">Cost:</span> ${formatCurrency(Number(project.estimatedCost))}</p>` : ""}
        ${project.percentComplete !== undefined ? `<p style="font-size: 12px;"><span style="color: #888;">Progress:</span> ${project.percentComplete}%</p>` : ""}
      </div>
    `;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps) {
        setTimeout(initMap, 100);
        return;
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const mapCenter = getMapCenter();

      googleMapRef.current = new google.maps.Map(mapRef.current!, {
        center: mapCenter,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Create single info window (reused for all markers)
      infoWindowRef.current = new google.maps.InfoWindow();

      // Add markers for each project
      projectsWithLocation.forEach((project) => {
        const position = {
          lat: Number(project.latitude),
          lng: Number(project.longitude),
        };

        const marker = new google.maps.Marker({
          position,
          map: googleMapRef.current || undefined,
          icon: createMarkerIcon(project.status),
          title: project.title,
        });

        marker.addListener("click", () => {
          infoWindowRef.current?.setContent(createInfoContent(project));
          infoWindowRef.current?.open(googleMapRef.current || undefined, marker);
        });

        if (onProjectClick) {
          marker.addListener("dblclick", () => {
            onProjectClick(project);
          });
        }

        markersRef.current.push(marker);
      });

      // Fit bounds if we have multiple projects
      if (projectsWithLocation.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        projectsWithLocation.forEach((project) => {
          bounds.extend({
            lat: Number(project.latitude),
            lng: Number(project.longitude),
          });
        });
        googleMapRef.current.fitBounds(bounds, 50);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [projects, zoom, getMapCenter, onProjectClick]);

  return (
    <div className={`relative rounded-lg overflow-hidden border ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {projectsWithLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none">
          <p className="text-sm text-muted-foreground">No projects with location data</p>
        </div>
      )}
    </div>
  );
}

// Legend component for the map
export function GoogleProjectMapLegend() {
  const statuses = [
    { label: "Proposed", color: "#3b82f6" },
    { label: "Approved", color: "#8b5cf6" },
    { label: "In Progress", color: "#eab308" },
    { label: "Completed", color: "#22c55e" },
    { label: "Cancelled", color: "#ef4444" },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: status.color }}
          />
          <span>{status.label}</span>
        </div>
      ))}
    </div>
  );
}
