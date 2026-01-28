
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Vote, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { voterApi } from "@/lib/api";

export function FundDistribution() {
    const { data: funds } = useQuery({
        queryKey: ["voter-funds"],
        queryFn: async () => {
            const res = await voterApi.getFunds();
            return res.success ? (res as any).data : [];
        },
    });

    const { data: societyAllocations } = useQuery({
        queryKey: ["voter-society-allocations"],
        queryFn: async () => {
            const res = await voterApi.getSocietyFundAllocations();
            return res.success ? (res as any).data : [];
        },
    });

    // Calculate totals by source
    const fundsBySource = (funds || []).reduce((acc: any, fund: any) => {
        const source = fund.source || "Other";
        acc[source] = (acc[source] || 0) + Number(fund.amount);
        return acc;
    }, {});

    const totalWardFunds = Object.values(fundsBySource).reduce((sum: any, val: any) => sum + val, 0) as number;
    const sortedSources = Object.entries(fundsBySource).sort(([, a], [, b]) => (b as number) - (a as number));

    // Calculate total society allocation
    const totalSocietyAllocation = (societyAllocations || []).reduce((sum: number, alloc: any) => sum + Number(alloc.amount), 0);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Ward Funds by Source */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Vote className="h-5 w-5" />
                        Fund Sources
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Where the money comes from</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sortedSources.length > 0 ? (
                        sortedSources.map(([source, amount]: [string, any]) => (
                            <div key={source} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{source}</span>
                                    <span className="font-bold">{formatCurrency(amount)}</span>
                                </div>
                                <Progress value={(amount / totalWardFunds) * 100} className="h-2" />
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No fund data available</p>
                    )}
                </CardContent>
            </Card>

            {/* Society Funds */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Funds Allocated for Your Society
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Directly benefiting your community</p>
                    </div>
                    <Link href="/voter/my-society">
                        <Button variant="ghost" size="sm">
                            See All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="text-4xl font-bold text-primary mb-2">
                            {formatCurrency(totalSocietyAllocation)}
                        </div>
                        <p className="text-muted-foreground">Total funds allocated to your society</p>
                    </div>

                    <div className="space-y-4 mt-6">
                        {societyAllocations && societyAllocations.length > 0 ? (
                            societyAllocations.slice(0, 3).map((alloc: any) => (
                                <div key={alloc.id} className="border-b last:border-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">{alloc.purpose || "General Development"}</p>
                                            <p className="text-xs text-muted-foreground">{alloc.financialYear}</p>
                                        </div>
                                        <span className="font-bold text-sm">{formatCurrency(alloc.amount)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">No specific allocations yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
