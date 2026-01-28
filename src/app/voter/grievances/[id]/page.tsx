"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { voterApi } from "@/lib/api";
import { formatDate, formatDateTime, getStatusColor, getPriorityColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
} from "lucide-react";
import { CommentSection } from "@/components/comments/comment-section";

export default function GrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const grievanceUuid = params.id as string;

  // Fetch grievance details
  const { data: grievance, isLoading } = useQuery({
    queryKey: ["voter-grievance", grievanceUuid],
    queryFn: async () => {
      const res = await voterApi.getGrievance(grievanceUuid);
      return res.success ? (res as any).data : null;
    },
    enabled: !!grievanceUuid,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (voteType: "upvote" | "downvote") => voterApi.voteGrievance(grievanceUuid, voteType),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["voter-grievance", grievanceUuid] });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{grievance.title}</h1>
          <p className="text-muted-foreground">{grievance.category}</p>
        </div>
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
                <div className="col-span-2 flex gap-4">
                  <Button
                    variant={grievance.userVote === "upvote" ? "default" : "outline"}
                    size="sm"
                    onClick={() => voteMutation.mutate("upvote")}
                    disabled={voteMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {grievance.upvoteCount || 0}
                  </Button>
                  <Button
                    variant={grievance.userVote === "downvote" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => voteMutation.mutate("downvote")}
                    disabled={voteMutation.isPending}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {grievance.downvoteCount || 0}
                  </Button>
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
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted By</p>
                      <p className="font-medium">{grievance.user.name}</p>
                    </div>
                  </div>
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
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Official Response
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
                      <p className="font-medium text-sm">Response Received</p>
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
    </div>
  );
}
