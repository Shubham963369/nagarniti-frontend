"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { voterApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast, toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import { ImageUpload } from "@/components/ui/image-upload";
import { DocumentUpload, DocumentList } from "@/components/ui/document-upload";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

// Dynamically import Google Maps components to avoid SSR issues
const GoogleLocationPicker = dynamic(
  () => import("@/components/maps/google-location-picker").then((mod) => mod.GoogleLocationPicker),
  { ssr: false, loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse" /> }
);

const GoogleSingleLocationMap = dynamic(
  () => import("@/components/maps/google-single-location-map").then((mod) => mod.GoogleSingleLocationMap),
  { ssr: false, loading: () => <div className="h-32 bg-muted rounded-lg animate-pulse" /> }
);

import { CommentSection } from "@/components/comments/comment-section";
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

const GRIEVANCE_CATEGORIES = [
  "Roads & Infrastructure",
  "Water Supply",
  "Drainage & Sewage",
  "Street Lights",
  "Garbage Collection",
  "Public Safety",
  "Parks & Gardens",
  "Other",
];

const GRIEVANCE_STATUSES = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800", bgColor: "bg-blue-50 border-blue-200" },
  { value: "under_review", label: "Under Review", color: "bg-yellow-100 text-yellow-800", bgColor: "bg-yellow-50 border-yellow-200" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800", bgColor: "bg-orange-50 border-orange-200" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800", bgColor: "bg-green-50 border-green-200" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800", bgColor: "bg-red-50 border-red-200" },
];

const getGrievanceStatusColor = (status: string) => {
  const found = GRIEVANCE_STATUSES.find(s => s.value === status);
  return found?.color || "bg-gray-100 text-gray-800";
};

export default function VoterGrievancesPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_voted">("newest");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    imageUrls: [] as string[],
    documentUrls: [] as string[],
  });

  const { data: grievances, isLoading } = useQuery({
    queryKey: ["voter-grievances"],
    queryFn: async () => {
      const res = await voterApi.getGrievances();
      return res.success ? (res as any).data : [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await voterApi.submitGrievance(data);
      if (!res.success) throw new Error(res.error || "Failed to submit");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voter-grievances"] });
      closeDialog();
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ uuid, voteType }: { uuid: string; voteType: "upvote" | "downvote" }) =>
      voterApi.voteGrievance(uuid, voteType),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["voter-grievances"] });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      category: "",
      location: "",
      latitude: null,
      longitude: null,
      imageUrls: [],
      documentUrls: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleVote = (grievanceUuid: string, voteType: "upvote" | "downvote") => {
    voteMutation.mutate({ uuid: grievanceUuid, voteType });
  };

  // Filter and sort grievances
  const filteredGrievances = grievances
    ?.filter((grievance: any) => {
      const matchesSearch = !searchQuery ||
        grievance.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grievance.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grievance.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || grievance.category === categoryFilter;

      let matchesTab = true;
      if (activeTab === "mine") matchesTab = grievance.userId === user?.id;
      else if (activeTab === "resolved") matchesTab = grievance.status === "resolved";
      else if (activeTab === "pending") matchesTab = !["resolved", "rejected"].includes(grievance.status);

      return matchesSearch && matchesCategory && matchesTab;
    })
    ?.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "most_voted") {
        const aVotes = (a.upvoteCount || 0) - (a.downvoteCount || 0);
        const bVotes = (b.upvoteCount || 0) - (b.downvoteCount || 0);
        return bVotes - aVotes;
      }
      return 0;
    }) || [];

  // Stats
  const myGrievances = grievances?.filter((g: any) => g.userId === user?.id) || [];
  const stats = {
    total: grievances?.length || 0,
    mine: myGrievances.length,
    resolved: grievances?.filter((g: any) => g.status === "resolved").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Public Grievances</h1>
          <p className="text-muted-foreground">Submit issues and vote on community concerns</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Submit Grievance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
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
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-xl font-bold text-blue-600">{stats.mine}</div>
                <p className="text-xs text-muted-foreground">My Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground">Resolved</p>
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
              placeholder="Search grievances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {GRIEVANCE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
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
              <SelectItem value="most_voted">Most Voted</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">My Submissions</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grievances Display */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading grievances...</div>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {GRIEVANCE_STATUSES.map((status) => {
            const statusGrievances = filteredGrievances.filter(
              (g: any) => g.status === status.value
            );
            return (
              <div
                key={status.value}
                className={`rounded-lg border ${status.bgColor} min-h-[400px] flex flex-col`}
              >
                <div className="p-3 border-b bg-white/50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{status.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {statusGrievances.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[600px]">
                  {statusGrievances.length > 0 ? (
                    statusGrievances.map((grievance: any) => (
                      <Link
                        key={grievance.uuid}
                        href={`/voter/grievances/${grievance.uuid}`}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {grievance.title}
                            </h4>
                            {grievance.category && (
                              <Badge variant="outline" className="text-xs mb-2">
                                {grievance.category}
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {grievance.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {(grievance.upvoteCount || 0) - (grievance.downvoteCount || 0)}
                              </span>
                              <span>{formatDate(grievance.createdAt)}</span>
                            </div>
                            {grievance.userId === user?.id && (
                              <Badge variant="secondary" className="text-xs mt-2">
                                Yours
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No grievances
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredGrievances.length > 0 ? (
            filteredGrievances.map((grievance: any) => (
            <Card key={grievance.uuid}>
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-4">
                  {/* Vote Buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant={grievance.userVote === "upvote" ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleVote(grievance.uuid, "upvote")}
                      disabled={voteMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {(grievance.upvoteCount || 0) - (grievance.downvoteCount || 0)}
                    </span>
                    <Button
                      variant={grievance.userVote === "downvote" ? "destructive" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleVote(grievance.uuid, "downvote")}
                      disabled={voteMutation.isPending}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{grievance.title}</h3>
                          {grievance.userId === user?.id && (
                            <Badge variant="outline" className="text-xs">Your submission</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getGrievanceStatusColor(grievance.status)}>
                            {grievance.status.replace("_", " ")}
                          </Badge>
                          {grievance.category && (
                            <Badge variant="secondary">{grievance.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-3">{grievance.description}</p>

                    {/* Images */}
                    {grievance.imageUrls && grievance.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {grievance.imageUrls.map((url: string, index: number) => (
                          <div key={index} className="relative w-20 h-20">
                            <Image
                              src={url}
                              alt={`Grievance image ${index + 1}`}
                              fill
                              className="object-cover rounded-lg border cursor-pointer hover:opacity-80"
                              onClick={() => window.open(url, "_blank")}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documents */}
                    {grievance.documentUrls && grievance.documentUrls.length > 0 && (
                      <div className="mb-3">
                        <DocumentList documents={grievance.documentUrls} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {grievance.user?.name || "Anonymous"}
                      </span>
                      {grievance.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {grievance.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(grievance.createdAt)}
                      </span>
                    </div>

                    {/* Location Map */}
                    {grievance.latitude && grievance.longitude && (
                      <div className="mt-3">
                        <GoogleSingleLocationMap
                          lat={Number(grievance.latitude)}
                          lng={Number(grievance.longitude)}
                          title={grievance.title}
                          className="h-32"
                        />
                      </div>
                    )}

                    {/* Admin Response */}
                    {grievance.adminResponse && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Official Response:</p>
                        <p className="text-sm text-muted-foreground">{grievance.adminResponse}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <Link href={`/voter/grievances/${grievance.uuid}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() =>
                          setExpandedComments(
                            expandedComments === grievance.uuid ? null : grievance.uuid
                          )
                        }
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comments
                        {expandedComments === grievance.uuid ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    </div>

                    {/* Expandable Comments Section */}
                    {expandedComments === grievance.uuid && (
                      <div className="mt-4 pt-4 border-t">
                        <CommentSection
                          entityType="grievance"
                          entityId={grievance.id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || activeTab !== "all"
                ? "No grievances match your filters"
                : "No grievances submitted yet"}
            </div>
          )}
        </div>
      )}

      {/* Submit Grievance Dialog - Wider with 2-column layout */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit a Grievance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title of the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRIEVANCE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photos (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add photos to help illustrate the issue
                  </p>
                  <ImageUpload
                    value={formData.imageUrls}
                    onChange={(urls) => setFormData({ ...formData, imageUrls: urls })}
                    folder="grievances"
                    maxFiles={5}
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Documents (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Attach supporting documents (PDF, DOC, DOCX)
                  </p>
                  <DocumentUpload
                    value={formData.documentUrls}
                    onChange={(urls) => setFormData({ ...formData, documentUrls: urls })}
                    folder="documents"
                    maxFiles={3}
                    disabled={submitMutation.isPending}
                  />
                </div>
              </div>

              {/* Right Column - Location */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location Address (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Near ABC School, MG Road"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pin on Map (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Click on the map to mark the exact location of the issue
                  </p>
                  <GoogleLocationPicker
                    value={
                      formData.latitude && formData.longitude
                        ? { lat: formData.latitude, lng: formData.longitude }
                        : null
                    }
                    onChange={(pos) =>
                      setFormData({
                        ...formData,
                        latitude: pos?.lat || null,
                        longitude: pos?.lng || null,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
