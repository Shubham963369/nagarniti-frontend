
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { voterApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    Phone,
    CreditCard,
    MapPin,
    Building2,
    CheckCircle,
    Clock,
    Home,
    AlertTriangle,
    ArrowRight,
    Settings
} from "lucide-react";

export default function VoterProfilePage() {
    const { user } = useAuthStore();

    const { data: societyAllocations } = useQuery({
        queryKey: ["voter-society-allocations"],
        queryFn: async () => {
            const res = await voterApi.getSocietyFundAllocations();
            return res.success ? (res as any).data : [];
        },
    });

    const { data: society } = useQuery({
        queryKey: ["voter-society"],
        queryFn: async () => {
            const res = await voterApi.getMySociety();
            return res.success ? (res as any).data : null;
        }
    });

    const { data: myGrievances } = useQuery({
        queryKey: ["voter-my-grievances"],
        queryFn: async () => {
            const res = await voterApi.getMyGrievances();
            return res.success ? (res as any).data : [];
        },
    });

    const resolvedGrievances = myGrievances?.filter((g: any) => g.status === "resolved") || [];
    const openGrievances = myGrievances?.filter((g: any) => g.status !== "resolved") || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <Link href="/voter/settings">
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{user?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                                    <p className="font-medium">{user?.mobile}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Voter ID</p>
                                    <p className="font-medium">{(user as any)?.voterId || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Society</p>
                                    <p className="font-medium">{society?.name || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Ward</p>
                                    <p className="font-medium">{user?.ward?.name} (Ward #{user?.ward?.number})</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Funds Allocated for Society */}
                <Card className="border-primary/20 shadow-md h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Building2 className="h-5 w-5" />
                                Funds Allocated for Your Society
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {society ? society.name : 'No society assigned'}
                            </p>
                        </div>
                        {society && (
                            <Link href="/voter/my-society">
                                <Button variant="ghost" size="sm">
                                    See All <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {societyAllocations && societyAllocations.length > 0 ? (
                                <div className="space-y-4">
                                    {societyAllocations.slice(0, 3).map((alloc: any) => {
                                        const CardWrapper = ({ children }: { children: React.ReactNode }) =>
                                            alloc.project?.uuid ? (
                                                <Link href={`/voter/projects/${alloc.project.uuid}`} className="block h-full cursor-pointer">
                                                    {children}
                                                </Link>
                                            ) : (
                                                <div className="block h-full">{children}</div>
                                            );

                                        return (
                                            <CardWrapper key={alloc.id}>
                                                <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                            {alloc.financialYear}
                                                        </Badge>
                                                        <span className="font-bold text-lg text-primary">{formatCurrency(alloc.amount)}</span>
                                                    </div>
                                                    <p className="font-medium text-sm line-clamp-1" title={alloc.purpose}>{alloc.purpose || "General Development"}</p>
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                            <span>Utilization</span>
                                                            <span>{alloc.status === 'utilized' ? '100%' : 'Allocated'}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${alloc.status === 'utilized' ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: alloc.status === 'utilized' ? '100%' : '20%' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardWrapper>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                                    <p>No funds allocated to your society yet.</p>
                                    {!society && <p className="text-xs mt-2">Contact your ward admin to join a society.</p>}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grievances Tabs */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        My Grievances
                    </CardTitle>
                    <div className="flex gap-2">
                        <Link href="/voter/grievances">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="active">Active ({openGrievances.length})</TabsTrigger>
                            <TabsTrigger value="resolved">Resolved ({resolvedGrievances.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="space-y-4">
                            {openGrievances.length > 0 ? (
                                openGrievances.map((g: any) => (
                                    <Link href={`/voter/grievances/${g.uuid}`} key={g.id}>
                                        <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">{g.category.replace('_', ' ')}</Badge>
                                                    <span className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</span>
                                                </div>
                                                <p className="font-medium line-clamp-1">{g.title}</p>
                                            </div>
                                            <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No active grievances.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="resolved" className="space-y-4">
                            {resolvedGrievances.length > 0 ? (
                                resolvedGrievances.map((g: any) => (
                                    <Link href={`/voter/grievances/${g.uuid}`} key={g.id}>
                                        <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors mb-3 bg-green-50/50 border-green-100">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">{g.category.replace('_', ' ')}</Badge>
                                                    <span className="text-xs text-muted-foreground">Resolved: {formatDate(g.resolvedAt)}</span>
                                                </div>
                                                <p className="font-medium line-clamp-1">{g.title}</p>
                                            </div>
                                            <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No resolved grievances yet.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
