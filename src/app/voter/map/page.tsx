"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { voterApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor, getFundSourceColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { MapPin, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Dynamically import map components to avoid SSR issues
const ProjectMap = dynamic(
  () => import("@/components/maps/project-map").then((mod) => mod.ProjectMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const ProjectMapLegend = dynamic(
  () => import("@/components/maps/project-map").then((mod) => mod.ProjectMapLegend),
  { ssr: false }
);

export default function VoterMapPage() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["voter-projects"],
    queryFn: async () => {
      const res = await voterApi.getProjects();
      return res.success ? (res as any).data : [];
    },
  });

  // Filter projects by status
  const filteredProjects = statusFilter === "all"
    ? projects
    : projects?.filter((p: any) => p.status === statusFilter);

  // Count projects with location data
  const projectsWithLocation = projects?.filter(
    (p: any) => p.latitude && p.longitude
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/voter/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Projects Map</h1>
            <p className="text-muted-foreground">
              View all ward projects on the map ({projectsWithLocation} locations)
            </p>
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map Legend */}
      <Card>
        <CardContent className="py-3">
          <ProjectMapLegend />
        </CardContent>
      </Card>

      {/* Map */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ProjectMap
          projects={filteredProjects || []}
          className="h-[500px]"
          onProjectClick={(project) => setSelectedProject(project)}
        />
      )}

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              {selectedProject.imageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={selectedProject.imageUrl}
                    alt={selectedProject.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedProject.status)}>
                  {selectedProject.status.replace("_", " ")}
                </Badge>
                {selectedProject.fundSource && (
                  <Badge variant="outline" className={getFundSourceColor(selectedProject.fundSource)}>
                    {selectedProject.fundSource}
                  </Badge>
                )}
              </div>

              {selectedProject.description && (
                <p className="text-muted-foreground">{selectedProject.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedProject.location && (
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedProject.location}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Estimated Cost</p>
                  <p className="font-medium">{formatCurrency(selectedProject.estimatedCost || 0)}</p>
                </div>
                {selectedProject.startDate && (
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(selectedProject.startDate)}</p>
                  </div>
                )}
                {selectedProject.endDate && (
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(selectedProject.endDate)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Progress</p>
                <div className="flex items-center gap-4">
                  <Progress value={selectedProject.percentComplete || 0} className="flex-1" />
                  <span className="font-medium">{selectedProject.percentComplete || 0}%</span>
                </div>
              </div>

              <Link href="/voter/projects">
                <Button className="w-full">View All Projects</Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
