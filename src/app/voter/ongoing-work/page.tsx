"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { voterApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FundSourceBadge } from "@/components/common/fund-source-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Hammer, MapPin, Calendar, IndianRupee, Building2, Clock } from "lucide-react";

function OngoingProjectCard({ project }: { project: any }) {
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
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.percentComplete || 0}%</span>
          </div>
          <Progress value={project.percentComplete || 0} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Fund Source</p>
            <FundSourceBadge source={project.fundSource || "BMC"} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sanctioned Amount</p>
            <p className="font-semibold text-primary flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {formatCurrency(parseFloat(project.estimatedCost || "0"))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Start Date</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.startDate ? formatDate(project.startDate) : "Not started"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Expected Completion</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.expectedEndDate ? formatDate(project.expectedEndDate) : "TBD"}
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

export default function OngoingWorkPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["voter-projects"],
    queryFn: async () => {
      const res = await voterApi.getProjects();
      return res.success ? (res as any).data : [];
    },
  });

  const ongoingProjects = projects?.filter(
    (p: any) => p.status === "in_progress" || p.status === "approved"
  ) || [];

  const totalBudget = ongoingProjects.reduce(
    (sum: number, p: any) => sum + parseFloat(p.estimatedCost || "0"),
    0
  );

  const avgProgress = ongoingProjects.length > 0
    ? Math.round(
        ongoingProjects.reduce((sum: number, p: any) => sum + (p.percentComplete || 0), 0) /
        ongoingProjects.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Hammer className="h-6 w-6 text-yellow-500" />
          Ongoing Work
        </h1>
        <p className="text-muted-foreground">
          Development projects currently in progress in your ward
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Hammer className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">{ongoingProjects.length}</div>
                <p className="text-sm text-yellow-600">Active Projects</p>
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
                  {formatCurrency(totalBudget)}
                </div>
                <p className="text-sm text-blue-600">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold text-indigo-700">{avgProgress}%</div>
                <p className="text-sm text-indigo-600">Avg. Progress</p>
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
      ) : ongoingProjects.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No Ongoing Work"
          description="There are no projects currently in progress in your ward."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ongoingProjects.map((project: any) => (
            <OngoingProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
