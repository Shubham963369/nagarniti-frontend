"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ClipboardList,
  Users,
  AlertTriangle,
} from "lucide-react";

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
function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ef4444", "#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  proposed: "#3b82f6",
  approved: "#22c55e",
  in_progress: "#f97316",
  completed: "#10b981",
  cancelled: "#ef4444",
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await adminApi.getAnalytics();
      return res.success ? (res as any).data : null;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights across all wards</p>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
    );
  }

  // Process data for charts
  const wardFundsData = analytics?.wardStats?.map((ward: any) => ({
    name: ward.wardName,
    totalFunds: parseFloat(ward.totalFunds) || 0,
    usedFunds: parseFloat(ward.usedFunds) || 0,
    projects: ward.projectsCount || 0,
  })) || [];

  const projectStatusData = analytics?.projectsByStatus?.map((item: any) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    value: parseInt(item.count),
    color: STATUS_COLORS[item.status] || "#64748b",
  })) || [];

  const fundSourceData = analytics?.fundsBySource?.map((item: any) => ({
    name: item.source,
    value: parseFloat(item.total) || 0,
  })) || [];

  const monthlyTrend = analytics?.monthlyTrend || [];

  const grievanceStats = analytics?.grievanceStats || {
    total: 0,
    resolved: 0,
    pending: 0,
    avgResolutionDays: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights across all wards</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds Allocated</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.summary?.totalFunds || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {analytics?.summary?.totalWards || 0} wards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary?.totalProjects || 0}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.summary?.completedProjects || 0} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Voters</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary?.totalVoters || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Grievances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grievanceStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {grievanceStats.avgResolutionDays} days to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funds">Funds Analysis</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="grievances">Grievances</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funds by Ward</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {wardFundsData.length > 0 && wardFundsData.some((w: any) => w.totalFunds > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wardFundsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis
                          tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
                          fontSize={12}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ color: "#000" }}
                        />
                        <Legend />
                        <Bar dataKey="totalFunds" name="Total Funds" fill="#f97316" />
                        <Bar dataKey="usedFunds" name="Used Funds" fill="#22c55e" />
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

            <Card>
              <CardHeader>
                <CardTitle>Funds by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {fundSourceData.length > 0 && fundSourceData.some((f: any) => f.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fundSourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {fundSourceData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No fund source data available. Add funds to see distribution.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {projectStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {projectStatusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No projects available. Create projects to see status distribution.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects per Ward</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {wardFundsData.length > 0 && wardFundsData.some((w: any) => w.projects > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wardFundsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="projects" name="Projects" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No projects per ward. Create projects to see this chart.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Funds Utilization Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis
                        tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
                        fontSize={12}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="allocated"
                        name="Allocated"
                        stroke="#f97316"
                        fill="#f9731640"
                      />
                      <Area
                        type="monotone"
                        dataKey="spent"
                        name="Spent"
                        stroke="#22c55e"
                        fill="#22c55e40"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No trend data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grievances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Grievances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{grievanceStats.total}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  All time submissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{grievanceStats.resolved}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {grievanceStats.total > 0
                    ? Math.round((grievanceStats.resolved / grievanceStats.total) * 100)
                    : 0}
                  % resolution rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-yellow-600">{grievanceStats.pending}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Awaiting resolution
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grievances by Ward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(analytics?.grievancesByWard || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.grievancesByWard || []}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="wardName" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#3b82f6" />
                      <Bar dataKey="resolved" name="Resolved" fill="#22c55e" />
                      <Bar dataKey="pending" name="Pending" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No grievances data available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
