"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { voterApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor, getFundSourceColor } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Search,
  ClipboardList,
  CheckCircle,
  Clock,
  IndianRupee,
  ChevronRight,
  ImageIcon,
  FileText,
  Eye,
} from "lucide-react";
import { DocumentList } from "@/components/ui/document-upload";
import { BeforeAfterComparison } from "@/components/projects/before-after-comparison";
import dynamic from "next/dynamic";

// Dynamically import map component to avoid SSR issues
const SingleLocationMap = dynamic(
  () => import("@/components/maps/single-location-map").then((mod) => mod.SingleLocationMap),
  { ssr: false, loading: () => <div className="h-40 bg-muted rounded-lg animate-pulse" /> }
);

import { CommentSection } from "@/components/comments/comment-section";

const FUND_SOURCES = ["BMC", "State Government", "Central Government", "MLA Fund", "MP Fund", "Other"];

export default function VoterProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fundSourceFilter, setFundSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "cost_high" | "cost_low" | "progress">("newest");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["voter-projects"],
    queryFn: async () => {
      const res = await voterApi.getProjects();
      return res.success ? (res as any).data : [];
    },
  });

  // Filter and sort projects
  const filteredProjects = projects
    ?.filter((project: any) => {
      const matchesSearch = !searchQuery ||
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesStatus = statusFilter === "all";
      if (!matchesStatus) {
        if (statusFilter === "ongoing") {
          matchesStatus = project.status === "started" || project.status === "ongoing";
        } else {
          matchesStatus = project.status === statusFilter;
        }
      }
      const matchesFundSource = fundSourceFilter === "all" || project.fundSource === fundSourceFilter;
      return matchesSearch && matchesStatus && matchesFundSource;
    })
    ?.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "cost_high") {
        return (parseFloat(b.estimatedCost) || 0) - (parseFloat(a.estimatedCost) || 0);
      } else if (sortBy === "cost_low") {
        return (parseFloat(a.estimatedCost) || 0) - (parseFloat(b.estimatedCost) || 0);
      } else if (sortBy === "progress") {
        return (b.percentComplete || 0) - (a.percentComplete || 0);
      }
      return 0;
    }) || [];

  // Stats
  const stats = {
    total: projects?.length || 0,
    completed: projects?.filter((p: any) => p.status === "completed").length || 0,
    ongoing: projects?.filter((p: any) => p.status === "started" || p.status === "ongoing").length || 0,
    totalFunds: projects?.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedCost || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ward Projects</h1>
        <p className="text-muted-foreground">Track development projects in your ward</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-xl font-bold text-yellow-600">{stats.ongoing}</div>
                <p className="text-xs text-muted-foreground">Ongoing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold">{formatCurrency(stats.totalFunds)}</div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={fundSourceFilter} onValueChange={setFundSourceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fund Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {FUND_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="cost_high">Cost: High-Low</SelectItem>
              <SelectItem value="cost_low">Cost: Low-High</SelectItem>
              <SelectItem value="progress">By Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project: any) => (
            <Link key={project.uuid} href={`/voter/projects/${project.uuid}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Project Image Thumbnail */}
                  {project.imageUrl && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{project.title}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {project.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span>{formatCurrency(project.estimatedCost || 0)}</span>
                      {project.fundSource && (
                        <Badge variant="outline" className={getFundSourceColor(project.fundSource)}>
                          {project.fundSource}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{project.percentComplete || 0}%</span>
                      </div>
                      <Progress value={project.percentComplete || 0} className="h-2" />
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "No projects match your filters"
              : "No projects in your ward yet"}
          </div>
        )}
      </div>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              {/* Before/After Comparison or Project Main Image */}
              {selectedProject.beforeImageUrl && selectedProject.imageUrl ? (
                <div>
                  <p className="text-sm font-medium mb-2">Before & After Comparison</p>
                  <BeforeAfterComparison
                    beforeImage={selectedProject.beforeImageUrl}
                    afterImage={selectedProject.imageUrl}
                    beforeLabel="Before"
                    afterLabel="After"
                    className="h-56"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Drag the slider to compare before and after
                  </p>
                </div>
              ) : selectedProject.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={selectedProject.imageUrl}
                    alt={selectedProject.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}

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
                {selectedProject.expectedEndDate && (
                  <div>
                    <p className="text-muted-foreground">Expected End Date</p>
                    <p className="font-medium">{formatDate(selectedProject.expectedEndDate)}</p>
                  </div>
                )}
              </div>

              {/* Project Location Map */}
              {selectedProject.latitude && selectedProject.longitude && (
                <div>
                  <p className="text-sm font-medium mb-2">Project Location</p>
                  <SingleLocationMap
                    lat={Number(selectedProject.latitude)}
                    lng={Number(selectedProject.longitude)}
                    title={selectedProject.title}
                    className="h-40"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Progress</p>
                <div className="flex items-center gap-4">
                  <Progress value={selectedProject.percentComplete || 0} className="flex-1" />
                  <span className="font-medium">{selectedProject.percentComplete || 0}%</span>
                </div>
              </div>

              {/* Project Documents */}
              {selectedProject.documentUrls && selectedProject.documentUrls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Project Documents
                  </h4>
                  <DocumentList documents={selectedProject.documentUrls} />
                </div>
              )}

              {/* Project Updates */}
              {selectedProject.updates?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recent Updates</h4>
                  <div className="space-y-4">
                    {selectedProject.updates.map((update: any) => (
                      <div key={update.id} className="border-l-2 border-primary pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(update.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                        {/* Update Images */}
                        {update.imageUrls && update.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {update.imageUrls.map((url: string, index: number) => (
                              <div key={index} className="relative w-16 h-16">
                                <Image
                                  src={url}
                                  alt={`Update image ${index + 1}`}
                                  fill
                                  className="object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(url, "_blank")}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <CommentSection
                entityType="project"
                entityId={selectedProject.id}
                className="border-t pt-4"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
