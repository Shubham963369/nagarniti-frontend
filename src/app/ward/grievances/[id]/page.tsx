"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatDate, formatDateTime, getStatusColor, getPriorityColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { CommentSection } from "@/components/comments/comment-section";

const GRIEVANCE_STATUSES = ["pending", "under_review", "in_progress", "resolved", "rejected"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function GrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const grievanceUuid = params.id as string;

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    priority: "",
    adminResponse: "",
  });

  // Fetch grievance details
  const { data: grievance, isLoading } = useQuery({
    queryKey: ["grievance", grievanceUuid],
    queryFn: async () => {
      const res = await wardApi.getGrievance(grievanceUuid);
      return res.success ? (res as any).data : null;
    },
    enabled: !!grievanceUuid,
  });

  // Update grievance mutation
  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; priority?: string; adminResponse?: string }) =>
      wardApi.updateGrievance(grievanceUuid, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Grievance updated" });
        queryClient.invalidateQueries({ queryKey: ["grievance", grievanceUuid] });
        queryClient.invalidateQueries({ queryKey: ["ward-grievances"] });
        setIsUpdateDialogOpen(false);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openUpdateDialog = () => {
    if (grievance) {
      setUpdateForm({
        status: grievance.status,
        priority: grievance.priority || "medium",
        adminResponse: grievance.adminResponse || "",
      });
      setIsUpdateDialogOpen(true);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      status: updateForm.status,
      priority: updateForm.priority,
      adminResponse: updateForm.adminResponse || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Grievance not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{grievance.title}</h1>
            <p className="text-muted-foreground">{grievance.category}</p>
          </div>
        </div>
        <Button onClick={openUpdateDialog}>
          <Pencil className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Grievance Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(grievance.status)}`}>
                    {grievance.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={`mt-1 ${getPriorityColor(grievance.priority)}`}>
                    {grievance.priority || "Medium"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> Upvotes
                  </p>
                  <p className="text-xl font-bold text-green-600">{grievance.upvoteCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> Downvotes
                  </p>
                  <p className="text-xl font-bold text-red-600">{grievance.downvoteCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {grievance.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{grievance.location || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{formatDateTime(grievance.createdAt)}</p>
                  </div>
                </div>
                {grievance.user && (
                  <>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted By</p>
                        <p className="font-medium">{grievance.user.name}</p>
                      </div>
                    </div>
                    {grievance.user.mobile && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">{grievance.user.mobile}</p>
                        </div>
                      </div>
                    )}
                    {grievance.user.email && (
                      <div className="flex items-start gap-2 col-span-2">
                        <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{grievance.user.email}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {grievance.imageUrls && grievance.imageUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attached Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {grievance.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                      <Image src={url} alt={`Image ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Response */}
          {grievance.adminResponse && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Admin Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{grievance.adminResponse}</p>
                {grievance.respondedByUser && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Responded by {grievance.respondedByUser.name}
                    {grievance.respondedAt && ` on ${formatDateTime(grievance.respondedAt)}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Discussion Section */}
          {grievance.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentSection entityType="grievance" entityId={grievance.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status Timeline */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Status */}
                <div className="relative pl-4 pb-4 border-l-2 border-primary">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Badge className={getStatusColor(grievance.status)}>
                      {grievance.status.replace("_", " ")}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Current Status</p>
                  </div>
                </div>

                {/* Responded At */}
                {grievance.respondedAt && (
                  <div className="relative pl-4 pb-4 border-l-2 border-muted">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-muted-foreground" />
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="font-medium text-sm">Response Added</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(grievance.respondedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created At */}
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-muted-foreground" />
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-sm">Grievance Submitted</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(grievance.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Grievance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={updateForm.status}
                  onValueChange={(value) => setUpdateForm({ ...updateForm, status: value })}
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
                <Label>Priority</Label>
                <Select
                  value={updateForm.priority}
                  onValueChange={(value) => setUpdateForm({ ...updateForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Response to Citizen</Label>
              <Textarea
                value={updateForm.adminResponse}
                onChange={(e) => setUpdateForm({ ...updateForm, adminResponse: e.target.value })}
                placeholder="Enter your response or update for the citizen..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
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
