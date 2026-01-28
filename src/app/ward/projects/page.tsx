"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { wardApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor, getFundSourceColor } from "@/lib/utils";
import { useToast, toast } from "@/hooks/use-toast";
import { SingleImageUpload, ImageUpload } from "@/components/ui/image-upload";
import { DocumentUpload, DocumentList } from "@/components/ui/document-upload";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

// Dynamically import AddressLocationPicker to avoid SSR issues with Leaflet
const AddressLocationPicker = dynamic(
  () => import("@/components/maps/address-location-picker").then((mod) => mod.AddressLocationPicker),
  { ssr: false, loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse" /> }
);

import { ExportButtons } from "@/components/reports/export-buttons";
import { generateProjectsPDF, generateProjectsExcel } from "@/lib/reports";
import { useAuthStore } from "@/stores/auth-store";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  ClipboardList,
  History,
  Settings2,
  Eye,
  Building2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROJECT_STATUSES = ["planned", "started", "ongoing", "completed", "on_hold", "cancelled"];
const FUND_SOURCES = ["BMC", "State Government", "Central Government", "MLA Fund", "MP Fund", "Other"];
const PROJECT_CATEGORIES = [
  { value: "road", label: "Road" },
  { value: "drainage", label: "Drainage" },
  { value: "water_supply", label: "Water Supply" },
  { value: "street_lights", label: "Street Lights" },
  { value: "garden", label: "Garden" },
  { value: "sanitation", label: "Sanitation" },
  { value: "building", label: "Building" },
  { value: "bridge", label: "Bridge" },
  { value: "other", label: "Other" },
];

export default function ProjectsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [projectFormData, setProjectFormData] = useState({
    title: "",
    description: "",
    category: "",
    societyId: null as number | null,
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    estimatedCost: "",
    fundSource: "",
    status: "planned",
    startDate: "",
    expectedEndDate: "",
    percentComplete: "0",
    imageUrl: null as string | null,
    beforeImageUrl: null as string | null,
    documentUrls: [] as string[],
  });

  const [updateFormData, setUpdateFormData] = useState({
    title: "",
    description: "",
    percentComplete: "",
    imageUrls: [] as string[],
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["ward-projects"],
    queryFn: async () => {
      const res = await wardApi.getProjects();
      return res.success ? (res as any).data : [];
    },
  });

  const { data: funds } = useQuery({
    queryKey: ["ward-funds"],
    queryFn: async () => {
      const res = await wardApi.getFunds();
      return res.success ? (res as any).data : [];
    },
  });

  const { data: societies } = useQuery({
    queryKey: ["ward-societies"],
    queryFn: async () => {
      const res = await wardApi.getSocieties();
      return res.success ? (res as any).data : [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await wardApi.createProject(data);
      if (!res.success) throw new Error(res.error || "Failed to create project");
      return res;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Project created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ward-projects"] });
      queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
      closeProjectDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await wardApi.updateProject(id, data);
      if (!res.success) throw new Error(res.error || "Failed to update project");
      return res;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Project updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ward-projects"] });
      queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
      closeProjectDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await wardApi.deleteProject(id);
      if (!res.success) throw new Error(res.error || "Failed to delete project");
      return res;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Project deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ward-projects"] });
      queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: any }) => {
      const res = await wardApi.addProjectUpdate(projectId, data);
      if (!res.success) throw new Error(res.error || "Failed to post update");
      return res;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Update posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ward-projects"] });
      closeUpdateDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreateProjectDialog = () => {
    setEditingProject(null);
    setProjectFormData({
      title: "",
      description: "",
      category: "",
      societyId: null,
      location: "",
      latitude: null,
      longitude: null,
      estimatedCost: "",
      fundSource: "",
      status: "planned",
      startDate: "",
      expectedEndDate: "",
      percentComplete: "0",
      imageUrl: null,
      beforeImageUrl: null,
      documentUrls: [],
    });
    setIsProjectDialogOpen(true);
  };

  const openEditProjectDialog = (project: any) => {
    setEditingProject(project);
    setProjectFormData({
      title: project.title,
      description: project.description || "",
      category: project.category || "",
      societyId: project.societyId || null,
      location: project.location || "",
      latitude: project.latitude ? Number(project.latitude) : null,
      longitude: project.longitude ? Number(project.longitude) : null,
      estimatedCost: project.estimatedCost?.toString() || "",
      fundSource: project.fundSource || "",
      status: project.status,
      startDate: project.startDate?.split("T")[0] || "",
      expectedEndDate: project.expectedEndDate?.split("T")[0] || "",
      percentComplete: project.percentComplete?.toString() || "0",
      imageUrl: project.imageUrl || null,
      beforeImageUrl: project.beforeImageUrl || null,
      documentUrls: project.documentUrls || [],
    });
    setIsProjectDialogOpen(true);
  };

  const closeProjectDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const openUpdateDialog = (project: any) => {
    setSelectedProject(project);
    setUpdateFormData({
      title: "",
      description: "",
      percentComplete: project.percentComplete?.toString() || "0",
      imageUrls: [],
    });
    setIsUpdateDialogOpen(true);
  };

  const closeUpdateDialog = () => {
    setIsUpdateDialogOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...projectFormData,
      estimatedCost: projectFormData.estimatedCost ? parseFloat(projectFormData.estimatedCost) : null,
      percentComplete: parseInt(projectFormData.percentComplete),
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: submitData });
    } else {
      createProjectMutation.mutate(submitData);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    addUpdateMutation.mutate({
      projectId: selectedProject.id,
      data: {
        ...updateFormData,
        percentComplete: parseInt(updateFormData.percentComplete),
      },
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Delete this project?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  // Filter projects
  const filteredProjects = projects?.filter((p: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "ongoing") return p.status === "started" || p.status === "ongoing" || p.status === "in_progress";
    return p.status === statusFilter;
  }) || [];

  // Stats
  const stats = {
    total: projects?.length || 0,
    planned: projects?.filter((p: any) => p.status === "planned" || p.status === "proposed").length || 0,
    ongoing: projects?.filter((p: any) => p.status === "started" || p.status === "ongoing" || p.status === "in_progress" || p.status === "approved").length || 0,
    completed: projects?.filter((p: any) => p.status === "completed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects Management</h1>
          <p className="text-muted-foreground">Track and manage ward development projects</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            onExportPDF={() => generateProjectsPDF(projects || [], user?.ward?.name || "Ward")}
            onExportExcel={() => generateProjectsExcel(projects || [], user?.ward?.name || "Ward")}
            disabled={!projects?.length}
          />
          <Button onClick={openCreateProjectDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500" onClick={() => setStatusFilter("planned")}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.planned}</div>
            <p className="text-sm text-muted-foreground">Planned</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500" onClick={() => setStatusFilter("ongoing")}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.ongoing}</div>
            <p className="text-sm text-muted-foreground">Ongoing</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500" onClick={() => setStatusFilter("completed")}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Badge>{statusFilter.replace("_", " ")}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
            Clear
          </Button>
        </div>
      )}

      {/* Projects List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading projects...
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project: any) => (
            <Card key={project.id} className="flex flex-col">
              {/* Project Image */}
              {project.imageUrl && (
                <div className="relative h-40 w-full">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                {project.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.category && (
                    <Badge variant="secondary">
                      {project.category.replace("_", " ")}
                    </Badge>
                  )}
                  {project.society && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      <Building2 className="h-3 w-3 mr-1" />
                      {project.society.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {project.description || "No description"}
                </p>

                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between text-sm">
                    <span>Est. Cost:</span>
                    <span className="font-medium">{formatCurrency(project.estimatedCost || 0)}</span>
                  </div>

                  {project.fundSource && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Source:</span>
                      <Badge variant="outline" className={getFundSourceColor(project.fundSource)}>
                        {project.fundSource}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.percentComplete || 0}%</span>
                    </div>
                    <Progress value={project.percentComplete || 0} />
                  </div>

                  {project.startDate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.startDate)}
                      {project.expectedEndDate && ` - ${formatDate(project.expectedEndDate)}`}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/ward/projects/${project.uuid}`} className="flex-1">
                            <Button variant="default" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                              {project.updates?.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                  {project.updates.length}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View project details and updates</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditProjectDialog(project)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit project details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete project</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No projects found
          </div>
        )}
      </div>

      {/* Create/Edit Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-4">
            {/* Row 1: Title, Category, Society */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={projectFormData.title}
                  onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  placeholder="e.g., Road Resurfacing on MG Road"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={projectFormData.category}
                  onValueChange={(value) => setProjectFormData({ ...projectFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="society">Society (Optional)</Label>
                <Select
                  value={projectFormData.societyId?.toString() || "none"}
                  onValueChange={(value) => setProjectFormData({ ...projectFormData, societyId: value === "none" ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ward-wide project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ward-wide (No specific society)</SelectItem>
                    {societies?.map((society: any) => (
                      <SelectItem key={society.id} value={society.id.toString()}>
                        {society.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                placeholder="Describe the project..."
                rows={2}
              />
            </div>

            {/* Row 3: Cost, Fund Source, Status, Progress */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (INR)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  value={projectFormData.estimatedCost}
                  onChange={(e) => setProjectFormData({ ...projectFormData, estimatedCost: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fundSource">Fund Source</Label>
                <Select
                  value={projectFormData.fundSource}
                  onValueChange={(value) => setProjectFormData({ ...projectFormData, fundSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={projectFormData.status}
                  onValueChange={(value) => setProjectFormData({ ...projectFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentComplete">Progress (%)</Label>
                <Input
                  id="percentComplete"
                  type="number"
                  value={projectFormData.percentComplete}
                  onChange={(e) => setProjectFormData({ ...projectFormData, percentComplete: e.target.value })}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Row 4: Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={projectFormData.startDate}
                  onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedEndDate">Expected End Date</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={projectFormData.expectedEndDate}
                  onChange={(e) => setProjectFormData({ ...projectFormData, expectedEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Row 5: Location with Address Autocomplete + Map */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <p className="text-xs text-muted-foreground mb-1">Search address or click on map</p>
                <AddressLocationPicker
                  address={projectFormData.location}
                  onAddressChange={(address) => setProjectFormData({ ...projectFormData, location: address })}
                  location={
                    projectFormData.latitude && projectFormData.longitude
                      ? { lat: projectFormData.latitude, lng: projectFormData.longitude }
                      : null
                  }
                  onLocationChange={(pos) =>
                    setProjectFormData({
                      ...projectFormData,
                      latitude: pos?.lat || null,
                      longitude: pos?.lng || null,
                    })
                  }
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Image (Current/After)</Label>
                  <SingleImageUpload
                    value={projectFormData.imageUrl}
                    onChange={(url) => setProjectFormData({ ...projectFormData, imageUrl: url })}
                    folder="projects"
                    disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Before Image (Optional)</Label>
                  <SingleImageUpload
                    value={projectFormData.beforeImageUrl}
                    onChange={(url) => setProjectFormData({ ...projectFormData, beforeImageUrl: url })}
                    folder="projects"
                    disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Documents */}
            <div className="space-y-2">
              <Label>Project Documents (Optional)</Label>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX - Max 5 files</p>
              <DocumentUpload
                value={projectFormData.documentUrls}
                onChange={(urls) => setProjectFormData({ ...projectFormData, documentUrls: urls })}
                folder="documents"
                maxFiles={5}
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeProjectDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              >
                {editingProject ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Project Update</DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">{selectedProject.title}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="updateTitle">Update Title</Label>
              <Input
                id="updateTitle"
                value={updateFormData.title}
                onChange={(e) => setUpdateFormData({ ...updateFormData, title: e.target.value })}
                placeholder="e.g., Week 2 Progress"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="updateDescription">Description</Label>
              <Textarea
                id="updateDescription"
                value={updateFormData.description}
                onChange={(e) => setUpdateFormData({ ...updateFormData, description: e.target.value })}
                placeholder="Describe the progress made..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="updatePercent">New Progress (%)</Label>
              <Input
                id="updatePercent"
                type="number"
                value={updateFormData.percentComplete}
                onChange={(e) => setUpdateFormData({ ...updateFormData, percentComplete: e.target.value })}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Progress Photos (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add photos showing project progress
              </p>
              <ImageUpload
                value={updateFormData.imageUrls}
                onChange={(urls) => setUpdateFormData({ ...updateFormData, imageUrls: urls })}
                folder="updates"
                maxFiles={5}
                disabled={addUpdateMutation.isPending}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeUpdateDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={addUpdateMutation.isPending}>
                Post Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
