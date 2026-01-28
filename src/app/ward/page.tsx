"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { wardApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  IndianRupee,
  ClipboardList,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Copy,
  Link as LinkIcon,
  Share2,
} from "lucide-react";

export default function WardDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const registrationSlug = user?.ward?.registrationSlug;
  const registrationLink = registrationSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${registrationSlug}`
    : null;

  const copyToClipboard = async () => {
    if (registrationLink) {
      await navigator.clipboard.writeText(registrationLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Registration link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["ward-stats"],
    queryFn: async () => {
      const res = await wardApi.getStats();
      return res.success ? (res as any).data : null;
    },
  });

  console.log("Ward Stats:", statsData);

  const { data: recentProjects } = useQuery({
    queryKey: ["ward-recent-projects"],
    queryFn: async () => {
      const res = await wardApi.getProjects();
      return res.success ? (res as any).data?.slice(0, 5) : [];
    },
  });

  const { data: recentGrievances } = useQuery({
    queryKey: ["ward-recent-grievances"],
    queryFn: async () => {
      const res = await wardApi.getGrievances();
      return res.success ? (res as any).data?.slice(0, 5) : [];
    },
  });

  const stats = statsData || {
    wardId: 0,
    wardName: user?.ward?.name || "Your Ward",
    totalFunds: "0",
    totalSpent: "0",
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0,
    totalVoters: 0,
    totalGrievances: 0,
    pendingGrievances: 0,
  };

  const utilizationPercentage =
    parseFloat(stats.totalFunds) > 0
      ? Math.round(
          (parseFloat(stats.totalSpent) / parseFloat(stats.totalFunds)) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ward Dashboard</h1>
        <p className="text-muted-foreground">{stats.wardName} - Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalFunds)}
            </div>
            <p className="text-xs text-muted-foreground">
              Spent: {formatCurrency(stats.totalSpent)} ({utilizationPercentage}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">
                {stats.completedProjects} done
              </span>
              <span className="text-yellow-600">
                {stats.ongoingProjects} ongoing
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Voters
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVoters}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grievances</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGrievances}</div>
            <p className="text-xs text-yellow-600">
              {stats.pendingGrievances} pending action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Link Card */}
      {registrationLink && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5" />
              Voter Registration Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Share this link with voters in your ward to let them register and access the platform.
            </p>
            <div className="flex gap-2">
              <Input
                value={registrationLink}
                readOnly
                className="font-mono text-sm bg-background"
              />
              <Button onClick={copyToClipboard} variant={copied ? "default" : "outline"}>
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects & Grievances */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects?.length > 0 ? (
                recentProjects.map((project: any) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(project.estimatedCost || 0)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No projects yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grievances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Grievances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrievances?.length > 0 ? (
                recentGrievances.map((grievance: any) => (
                  <div
                    key={grievance.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{grievance.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {grievance.user?.name || "Unknown"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(grievance.status)}>
                      {grievance.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No grievances yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
