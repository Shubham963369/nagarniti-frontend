"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { wardApi } from "@/lib/api";
import { formatDate, formatCurrency, getStatusColor, getFundSourceColor } from "@/lib/utils";
import {
  Building2,
  Users,
  IndianRupee,
  ClipboardList,
  Phone,
  MapPin,
  ArrowLeft,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function SocietyDetailPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const { data: society, isLoading } = useQuery({
    queryKey: ["society-detail", uuid],
    queryFn: async () => {
      const res = await wardApi.getSociety(uuid);
      return res.success ? (res as any).data : null;
    },
    enabled: !!uuid,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["society-projects", uuid],
    queryFn: async () => {
      const res = await wardApi.getSocietyProjects(uuid);
      return res.success ? (res as any).data : [];
    },
    enabled: !!uuid,
  });

  const { data: fundAllocations } = useQuery({
    queryKey: ["society-fund-allocations", uuid],
    queryFn: async () => {
      const res = await wardApi.getSocietyFundAllocations(uuid);
      return res.success ? (res as any).data : [];
    },
    enabled: !!uuid,
  });

  const { data: members } = useQuery({
    queryKey: ["society-members", uuid],
    queryFn: async () => {
      const res = await wardApi.getSocietyMembers(uuid);
      return res.success ? (res as any).data : [];
    },
    enabled: !!uuid,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!society) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Society not found</h2>
        <Link href="/ward/societies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Societies
          </Button>
        </Link>
      </div>
    );
  }

  const totalFunds = fundAllocations?.reduce(
    (sum: number, a: any) => sum + parseFloat(a.amount || "0"),
    0
  ) || 0;

  const completedProjects = projects?.filter((p: any) => p.status === "completed").length || 0;
  const ongoingProjects = projects?.filter((p: any) =>
    p.status === "in_progress" || p.status === "approved" || p.status === "started"
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ward/societies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{society.name}</h1>
          <p className="text-muted-foreground">Society Details & Projects</p>
        </div>
        <Badge className={society.isActive ? "bg-green-100 text-green-800 ml-auto" : "bg-gray-100 text-gray-800 ml-auto"}>
          {society.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Society Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1 grid md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-bold mb-2">{society.name}</h2>
                {society.address && (
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {society.address}
                    {society.pincode && ` - ${society.pincode}`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {society.totalUnits && (
                  <p className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{society.totalUnits}</span> units
                  </p>
                )}
                {society.contactPerson && (
                  <p className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {society.contactPerson}
                  </p>
                )}
                {society.contactMobile && (
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {society.contactMobile}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{members?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalFunds)}</div>
                <p className="text-sm text-muted-foreground">Funds Allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{ongoingProjects}</div>
                <p className="text-sm text-muted-foreground">Ongoing Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completedProjects}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Allocations */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Fund Allocations
        </h2>
        {fundAllocations && fundAllocations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fundAllocations.map((allocation: any) => (
              <Card key={allocation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseFloat(allocation.amount))}
                    </span>
                    <Badge variant="secondary">{allocation.financialYear}</Badge>
                  </div>
                  {allocation.purpose && (
                    <p className="text-sm text-muted-foreground mb-2">{allocation.purpose}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(allocation.allocatedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No fund allocations yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Society Projects ({projects?.length || 0})
        </h2>
        {projectsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project: any) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {project.imageUrl && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {project.location && (
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}

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

                  <Link href={`/ward/projects/${project.uuid}`}>
                    <Button variant="default" size="sm" className="w-full mt-2">
                      <Eye className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects assigned to this society yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Members */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registered Members ({members?.length || 0})
        </h2>
        {members && members.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      {member.mobile && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No members registered in this society yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
