"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { voterApi } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  FileText,
} from "lucide-react";
import { CommentSection } from "@/components/comments/comment-section";
import { DocumentList } from "@/components/ui/document-upload";
import dynamic from "next/dynamic";

const SingleLocationMap = dynamic(
  () => import("@/components/maps/single-location-map").then((mod) => mod.SingleLocationMap),
  { ssr: false, loading: () => <div className="h-48 bg-muted rounded-lg animate-pulse" /> }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectUuid = params.id as string;

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["voter-project", projectUuid],
    queryFn: async () => {
      const res = await voterApi.getProject(projectUuid);
      return res.success ? (res as any).data : null;
    },
    enabled: !!projectUuid,
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Project not found</p>
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
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">{project.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(project.status)}`}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{project.percentComplete || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(project.estimatedCost || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Cost</p>
                  <p className="text-xl font-bold">
                    {project.actualCost ? formatCurrency(project.actualCost) : "-"}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${project.percentComplete || 0}%` }}
                  />
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
                {project.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {project.startDate ? formatDate(project.startDate) : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected End</p>
                    <p className="font-medium">
                      {project.expectedEndDate ? formatDate(project.expectedEndDate) : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fund Source</p>
                    <p className="font-medium">{project.fundSource || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{project.location || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Map */}
          {project.latitude && project.longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Project Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SingleLocationMap
                  lat={Number(project.latitude)}
                  lng={Number(project.longitude)}
                  title={project.title}
                  className="h-72"
                />
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {(project.imageUrl || project.beforeImageUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Project Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {project.beforeImageUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Before</p>
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={project.beforeImageUrl}
                          alt="Before"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {project.imageUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.beforeImageUrl ? "After / Current" : "Current"}
                      </p>
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={project.imageUrl}
                          alt="Current"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {project.documentUrls && project.documentUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList documents={project.documentUrls} />
              </CardContent>
            </Card>
          )}

          {/* Discussion Section */}
          {project.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentSection entityType="project" entityId={project.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Updates Timeline */}
        <div className="space-y-6">
          {/* Updates Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Updates
                </span>
                <Badge variant="secondary">{project.updates?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.updates && project.updates.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {project.updates.map((update: any, index: number) => (
                    <div
                      key={update.id}
                      className={`relative pl-4 pb-4 ${
                        index !== project.updates.length - 1 ? "border-l-2 border-muted" : ""
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />

                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{update.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(update.createdAt)}
                        </p>
                        {update.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {update.description}
                          </p>
                        )}
                        {update.imageUrls && update.imageUrls.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {update.imageUrls.slice(0, 3).map((url: string, i: number) => (
                              <div
                                key={i}
                                className="relative w-16 h-16 rounded overflow-hidden"
                              >
                                <Image
                                  src={url}
                                  alt={`Update image ${i + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {update.imageUrls.length > 3 && (
                              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{update.imageUrls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No updates yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
