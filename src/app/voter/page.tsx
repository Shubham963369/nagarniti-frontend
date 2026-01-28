"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { voterApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor, getFundSourceColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  IndianRupee,
  ClipboardList,
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { FundDistribution } from "@/components/voter/fund-distribution";

export default function VoterDashboard() {
  const { user } = useAuthStore();

  const { data: statsData } = useQuery({
    queryKey: ["voter-stats"],
    queryFn: async () => {
      const res = await voterApi.getStats();
      return res.success ? (res as any).data : null;
    },
  });

  const { data: recentProjects } = useQuery({
    queryKey: ["voter-recent-projects"],
    queryFn: async () => {
      const res = await voterApi.getProjects();
      return res.success ? (res as any).data?.slice(0, 3) : [];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["voter-notifications"],
    queryFn: async () => {
      const res = await voterApi.getNotifications();
      return res.success ? (res as any).data?.slice(0, 3) : [];
    },
  });

  const stats = statsData || {
    wardName: user?.ward?.name || "Your Ward",
    totalFunds: "0",
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary to-orange-400 text-white">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-2">Welcome, {user?.name}!</h1>
          <p className="opacity-90">
            Ward: {stats.wardName} (Ward {user?.ward?.number})
          </p>
        </CardContent>
      </Card>

      {/* Fund Distribution */}
      <FundDistribution />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ward Funds</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFunds)}</div>
            <p className="text-xs text-muted-foreground">
              Allocated for development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {stats.completedProjects} done
              </span>
              <span className="text-yellow-600 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {stats.ongoingProjects} ongoing
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProjects > 0
                ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                stats.totalProjects > 0
                  ? (stats.completedProjects / stats.totalProjects) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>


      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Projects
          </CardTitle>
          <Link href="/voter/projects">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects?.length > 0 ? (
              recentProjects.map((project: any) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{project.title}</h3>
                      {project.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatCurrency(project.estimatedCost || 0)}</span>
                    {project.fundSource && (
                      <Badge variant="outline" className={getFundSourceColor(project.fundSource)}>
                        {project.fundSource}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{project.percentComplete || 0}%</span>
                    </div>
                    <Progress value={project.percentComplete || 0} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No projects in your ward yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Updates
          </CardTitle>
          <Link href="/voter/notifications">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications?.length > 0 ? (
              notifications.map((notification: any) => (
                <div key={notification.id} className="border-b pb-4 last:border-0">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No notifications yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
