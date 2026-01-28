"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { voterApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FundSourceBadge } from "@/components/common/fund-source-badge";
import { EmptyState } from "@/components/common/empty-state";
import { CheckCircle, MapPin, Calendar, IndianRupee, Building2 } from "lucide-react";

function CompletedProjectCard({ project }: { project: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {project.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            {project.location && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </CardDescription>
            )}
          </div>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Fund Source</p>
            <FundSourceBadge source={project.fundSource || "BMC"} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Cost</p>
            <p className="font-semibold text-primary flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {formatCurrency(parseFloat(project.actualCost || project.estimatedCost || "0"))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Start Date</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.startDate ? formatDate(project.startDate) : "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Completion Date</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.actualEndDate ? formatDate(project.actualEndDate) : "-"}
            </p>
          </div>
        </div>

        {project.contractorName && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Contractor</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {project.contractorName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WardUpdatesPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["voter-projects"],
    queryFn: async () => {
      const res = await voterApi.getProjects();
      return res.success ? (res as any).data : [];
    },
  });

  const completedProjects = projects?.filter((p: any) => p.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Ward Updates
        </h1>
        <p className="text-muted-foreground">
          Completed development projects in your ward
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-700">{completedProjects.length}</div>
                <p className="text-sm text-green-600">Completed Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(
                    completedProjects.reduce(
                      (sum: number, p: any) => sum + parseFloat(p.actualCost || p.estimatedCost || "0"),
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-blue-600">Total Investment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  {new Set(completedProjects.map((p: any) => p.contractorName).filter(Boolean)).size}
                </div>
                <p className="text-sm text-purple-600">Contractors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : completedProjects.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No Completed Projects Yet"
          description="There are no completed projects to show in your ward."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {completedProjects.map((project: any) => (
            <CompletedProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
