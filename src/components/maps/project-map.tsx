"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, formatCurrency } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Status-based marker icons
const createStatusIcon = (status: string) => {
  const colors: Record<string, string> = {
    proposed: "#3b82f6", // blue
    approved: "#8b5cf6", // purple
    in_progress: "#eab308", // yellow
    completed: "#22c55e", // green
    cancelled: "#ef4444", // red
    default: "#6b7280", // gray
  };

  const color = colors[status] || colors.default;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
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

interface ProjectMapProps {
  projects: Project[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onProjectClick?: (project: Project) => void;
}

export function ProjectMap({
  projects,
  center = { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
  zoom = 13,
  className = "h-96",
  onProjectClick,
}: ProjectMapProps) {
  // Filter projects that have valid coordinates
  const projectsWithLocation = projects.filter(
    (p) => p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
  );

  // Calculate center from projects if available
  let mapCenter = center;
  if (projectsWithLocation.length > 0) {
    const latSum = projectsWithLocation.reduce((sum, p) => sum + Number(p.latitude), 0);
    const lngSum = projectsWithLocation.reduce((sum, p) => sum + Number(p.longitude), 0);
    mapCenter = {
      lat: latSum / projectsWithLocation.length,
      lng: lngSum / projectsWithLocation.length,
    };
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {projectsWithLocation.map((project) => (
          <Marker
            key={project.id}
            position={[Number(project.latitude), Number(project.longitude)]}
            icon={createStatusIcon(project.status)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold mb-1">{project.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getStatusColor(project.status)} text-xs`}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                {project.location && (
                  <p className="text-xs text-muted-foreground mb-1">{project.location}</p>
                )}
                {project.estimatedCost && (
                  <p className="text-xs mb-1">
                    <span className="text-muted-foreground">Cost:</span>{" "}
                    {formatCurrency(Number(project.estimatedCost))}
                  </p>
                )}
                {project.percentComplete !== undefined && (
                  <p className="text-xs mb-2">
                    <span className="text-muted-foreground">Progress:</span>{" "}
                    {project.percentComplete}%
                  </p>
                )}
                {onProjectClick && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onProjectClick(project)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {projectsWithLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none">
          <p className="text-sm text-muted-foreground">No projects with location data</p>
        </div>
      )}
    </div>
  );
}

// Legend component for the map
export function ProjectMapLegend() {
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
