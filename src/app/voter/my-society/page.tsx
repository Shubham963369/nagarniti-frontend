"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { voterApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import { StatusBadge } from "@/components/common/status-badge";
import { FundSourceBadge } from "@/components/common/fund-source-badge";
import { EmptyState } from "@/components/common/empty-state";
import {
  Building2,
  Users,
  IndianRupee,
  ClipboardList,
  Phone,
  MapPin,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building,
  Eye,
} from "lucide-react";

// Project card component with better design
function SocietyProjectCard({ project }: { project: any }) {
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
      <CardHeader className="pb-2">
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
          <StatusBadge status={project.status} type="project" />
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
            <p className="text-muted-foreground text-xs">
              {project.status === "completed" ? "Total Cost" : "Budget"}
            </p>
            <p className="font-semibold text-primary flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {formatCurrency(parseFloat(project.actualCost || project.estimatedCost || "0"))}
            </p>
          </div>
          {project.startDate && (
            <div>
              <p className="text-muted-foreground text-xs">Start Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(project.startDate)}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs">
              {project.status === "completed" ? "Completed" : "Expected"}
            </p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.actualEndDate
                ? formatDate(project.actualEndDate)
                : project.expectedEndDate
                ? formatDate(project.expectedEndDate)
                : "TBD"}
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

        <div className="pt-2 border-t">
          <Link href={`/voter/projects/${project.uuid}`}>
            <Button variant="default" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Project Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MySocietyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("");

  // Get user's current society
  const { data: mySociety, isLoading: societyLoading } = useQuery({
    queryKey: ["my-society"],
    queryFn: async () => {
      const res = await voterApi.getMySociety();
      if (!res.success) return null;
      return (res as any).data;
    },
  });

  // Get society projects
  const { data: societyProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["society-projects"],
    queryFn: async () => {
      const res = await voterApi.getSocietyProjects();
      if (!res.success) return [];
      return (res as any).data || [];
    },
    enabled: !!mySociety,
  });

  // Get society fund allocations
  const { data: fundAllocations, isLoading: fundsLoading } = useQuery({
    queryKey: ["society-fund-allocations"],
    queryFn: async () => {
      const res = await voterApi.getSocietyFundAllocations();
      if (!res.success) return [];
      return (res as any).data || [];
    },
    enabled: !!mySociety,
  });

  // Get society members
  const { data: members } = useQuery({
    queryKey: ["society-members"],
    queryFn: async () => {
      const res = await voterApi.getSocietyMembers();
      if (!res.success) return [];
      return (res as any).data || [];
    },
    enabled: !!mySociety,
  });

  // Get available societies for joining
  const { data: availableSocieties } = useQuery({
    queryKey: ["available-societies"],
    queryFn: async () => {
      const res = await voterApi.getWardSocieties();
      if (!res.success) return [];
      return (res as any).data || [];
    },
    enabled: !mySociety,
  });

  // Join society mutation
  const joinMutation = useMutation({
    mutationFn: (societyId: number) => voterApi.joinSociety(societyId),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Successfully joined society" });
        queryClient.invalidateQueries({ queryKey: ["my-society"] });
        queryClient.invalidateQueries({ queryKey: ["society-projects"] });
        queryClient.invalidateQueries({ queryKey: ["society-fund-allocations"] });
        queryClient.invalidateQueries({ queryKey: ["society-members"] });
      } else {
        toast({ title: "Failed to join society", description: res.error, variant: "destructive" });
      }
    },
  });

  const handleJoinSociety = () => {
    if (!selectedSocietyId) {
      toast({ title: "Please select a society", variant: "destructive" });
      return;
    }
    joinMutation.mutate(parseInt(selectedSocietyId));
  };

  // Loading state
  if (societyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No society - show join option
  if (!mySociety) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            My Society
          </h1>
          <p className="text-muted-foreground">Join your residential society to see updates</p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">You are not part of any society</CardTitle>
            <CardDescription className="text-center">
              Join your residential society to see society-specific projects, fund allocations, and connect with your neighbors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableSocieties && availableSocieties.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select your society</label>
                  <Select value={selectedSocietyId} onValueChange={setSelectedSocietyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a society" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSocieties.map((society: any) => (
                        <SelectItem key={society.id} value={society.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{society.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleJoinSociety}
                  disabled={joinMutation.isPending || !selectedSocietyId}
                >
                  {joinMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Join Society
                </Button>
              </>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <p className="text-amber-800 text-center">
                    No societies available in your ward yet. Contact your ward office to add your society.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalFunds = fundAllocations?.reduce(
    (sum: number, a: any) => sum + parseFloat(a.amount || "0"),
    0
  ) || 0;
  const completedProjects = societyProjects?.filter((p: any) => p.status === "completed").length || 0;
  const ongoingProjects = societyProjects?.filter((p: any) => p.status === "in_progress").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building className="h-6 w-6" />
          My Society
        </h1>
        <p className="text-muted-foreground">
          Development projects for {mySociety.name}
        </p>
      </div>

      {/* Society Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold">{mySociety.name}</h2>
              {mySociety.address && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{mySociety.address}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {mySociety.totalUnits && (
                  <span className="text-sm flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {mySociety.totalUnits} units
                  </span>
                )}
                {mySociety.contactPerson && (
                  <span className="text-sm flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {mySociety.contactPerson}
                  </span>
                )}
                {mySociety.contactMobile && (
                  <span className="text-sm flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {mySociety.contactMobile}
                  </span>
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
              <ClipboardList className="h-8 w-8 text-yellow-500" />
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
        {fundsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : fundAllocations && fundAllocations.length > 0 ? (
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
          <EmptyState
            icon={IndianRupee}
            title="No Fund Allocations"
            description="No funds have been allocated to your society yet."
          />
        )}
      </div>

      {/* Society Projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Society Projects
        </h2>
        {projectsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : societyProjects && societyProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {societyProjects.map((project: any) => (
              <SocietyProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No Society Projects"
            description="No projects have been assigned to your society yet."
          />
        )}
      </div>

      {/* Society Members */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Society Members ({members?.length || 0})
        </h2>
        {members && members.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <EmptyState
            icon={Users}
            title="No Members"
            description="No other members have joined your society yet."
          />
        )}
      </div>
    </div>
  );
}
