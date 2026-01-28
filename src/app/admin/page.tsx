"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  IndianRupee,
  ClipboardList,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#FF6B35", "#2ECC71", "#3498DB", "#9B59B6", "#F39C12"];

// Loading skeleton for stats cards
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for chart cards
function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await adminApi.getStats();
      return res.success ? (res as any).data : null;
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await adminApi.getAnalytics();
      return res.success ? (res as any).data : null;
    },
  });

  const stats = statsData || {
    totalWards: 0,
    totalFunds: "0",
    totalSpent: "0",
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0,
    totalVoters: 0,
    totalGrievances: 0,
    pendingGrievances: 0,
  };

  // Process analytics data for charts
  const fundsBySourceData = analyticsData?.fundsBySource?.map((item: any) => ({
    name: item.source,
    value: parseFloat(item.total) || 0,
  })) || [];

  const projectsByStatusData = analyticsData?.projectsByStatus?.map((item: any) => ({
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    count: parseInt(item.count) || 0,
  })) || [];

  const fundsByWardData = analyticsData?.wardStats?.map((ward: any) => ({
    wardName: ward.wardName,
    totalFunds: parseFloat(ward.totalFunds) || 0,
  })) || [];

  const isLoading = statsLoading || analyticsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all wards and activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Wards</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWards}</div>
                <p className="text-xs text-muted-foreground">Active wards in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalFunds)}</div>
                <p className="text-xs text-muted-foreground">
                  Spent: {formatCurrency(stats.totalSpent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.completedProjects} done</span>
                  <span className="text-yellow-600">{stats.ongoingProjects} ongoing</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Voters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVoters}</div>
                <p className="text-xs text-muted-foreground">Active voter accounts</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Grievances Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grievances</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGrievances}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingGrievances}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalGrievances - stats.pendingGrievances}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Funds by Source */}
        {analyticsLoading ? (
          <ChartCardSkeleton title="Funds by Source" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Funds by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {fundsBySourceData.length > 0 && fundsBySourceData.some((f: any) => f.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fundsBySourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {fundsBySourceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No fund data available. Add funds to see distribution.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects by Status */}
        {analyticsLoading ? (
          <ChartCardSkeleton title="Projects by Status" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {projectsByStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF6B35" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No projects available. Create projects to see status.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funds by Ward */}
        {analyticsLoading ? (
          <div className="md:col-span-2">
            <ChartCardSkeleton title="Funds by Ward" />
          </div>
        ) : (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Funds by Ward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {fundsByWardData.length > 0 && fundsByWardData.some((w: any) => w.totalFunds > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fundsByWardData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="wardName" fontSize={12} />
                      <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="totalFunds" name="Total Funds" fill="#3498DB" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No fund data available. Add funds to wards to see this chart.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
