"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { wardApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { DocumentList } from "@/components/ui/document-upload";
import { ExportButtons } from "@/components/reports/export-buttons";
import { generateGrievancesPDF, generateGrievancesExcel } from "@/lib/reports";
import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";
import Link from "next/link";

const GRIEVANCE_STATUS_LIST = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800", bgColor: "bg-blue-50 border-blue-200" },
  { value: "under_review", label: "Under Review", color: "bg-yellow-100 text-yellow-800", bgColor: "bg-yellow-50 border-yellow-200" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800", bgColor: "bg-orange-50 border-orange-200" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800", bgColor: "bg-green-50 border-green-200" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800", bgColor: "bg-red-50 border-red-200" },
];

const GRIEVANCE_STATUSES = GRIEVANCE_STATUS_LIST.map(s => s.value);

const getGrievanceStatusColor = (status: string) => {
  const found = GRIEVANCE_STATUS_LIST.find(s => s.value === status);
  return found?.color || "bg-gray-100 text-gray-800";
};

export default function GrievancesPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [responseData, setResponseData] = useState({
    status: "",
    adminResponse: "",
  });

  const { data: grievances, isLoading } = useQuery({
    queryKey: ["ward-grievances"],
    queryFn: async () => {
      const res = await wardApi.getGrievances();
      return res.success ? (res as any).data : [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: any }) => wardApi.updateGrievance(uuid, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Grievance updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-grievances"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const openDialog = (grievance: any) => {
    setSelectedGrievance(grievance);
    setResponseData({
      status: grievance.status,
      adminResponse: grievance.adminResponse || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedGrievance(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    updateMutation.mutate({ uuid: selectedGrievance.uuid, data: responseData });
  };

  // Filter grievances
  const filteredGrievances = grievances?.filter((g: any) =>
    statusFilter === "all" ? true : g.status === statusFilter
  ) || [];

  // Stats
  const stats = {
    total: grievances?.length || 0,
    pending: grievances?.filter((g: any) =>
      ["submitted", "under_review", "in_progress"].includes(g.status)
    ).length || 0,
    resolved: grievances?.filter((g: any) => g.status === "resolved").length || 0,
    rejected: grievances?.filter((g: any) => g.status === "rejected").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grievances</h1>
          <p className="text-muted-foreground">Manage citizen grievances and feedback</p>
        </div>
        <ExportButtons
          onExportPDF={() => generateGrievancesPDF(grievances || [], user?.ward?.name || "Ward")}
          onExportExcel={() => generateGrievancesExcel(grievances || [], user?.ward?.name || "Ward")}
          disabled={!grievances?.length}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500" onClick={() => setStatusFilter("submitted")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500" onClick={() => setStatusFilter("resolved")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500" onClick={() => setStatusFilter("rejected")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & View Toggle */}
      <div className="flex items-center justify-between">
        {statusFilter !== "all" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtering by:</span>
            <Badge className={getGrievanceStatusColor(statusFilter)}>
              {statusFilter.replace("_", " ")}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
              Clear
            </Button>
          </div>
        ) : (
          <div />
        )}
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

      {/* Grievances Display */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading grievances...</div>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {GRIEVANCE_STATUS_LIST.map((status) => {
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
                      <Card
                        key={grievance.uuid || grievance.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openDialog(grievance)}
                      >
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
                              {grievance.upvoteCount || 0}
                            </span>
                            <span>{grievance.user?.name || "Anonymous"}</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Link
                              href={`/ward/grievances/${grievance.uuid}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
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
            <Card key={grievance.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{grievance.title}</h3>
                      <Badge className={getGrievanceStatusColor(grievance.status)}>
                        {grievance.status.replace("_", " ")}
                      </Badge>
                      {grievance.category && (
                        <Badge variant="outline">{grievance.category}</Badge>
                      )}
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
                        <User className="h-4 w-4" />
                        {grievance.user?.name || "Anonymous"}
                      </span>
                      {grievance.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {grievance.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(grievance.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {grievance.upvoteCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <ThumbsDown className="h-4 w-4" />
                        {grievance.downvoteCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {grievance.adminResponse && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Admin Response:</p>
                    <p className="text-sm text-muted-foreground">{grievance.adminResponse}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Link href={`/ward/grievances/${grievance.uuid}`}>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button onClick={() => openDialog(grievance)}>
                    Respond / Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No grievances found
            </div>
          )}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Grievance</DialogTitle>
            {selectedGrievance && (
              <p className="text-sm text-muted-foreground">{selectedGrievance.title}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={responseData.status}
                onValueChange={(value) => setResponseData({ ...responseData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRIEVANCE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminResponse">Response to Citizen</Label>
              <Textarea
                id="adminResponse"
                value={responseData.adminResponse}
                onChange={(e) => setResponseData({ ...responseData, adminResponse: e.target.value })}
                placeholder="Write your response to the citizen..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
