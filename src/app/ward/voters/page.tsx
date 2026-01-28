"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { wardApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Users, Search, Mail, Phone, Calendar, IdCard } from "lucide-react";

export default function VotersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: voters, isLoading } = useQuery({
    queryKey: ["ward-voters"],
    queryFn: async () => {
      const res = await wardApi.getVoters();
      return res.success ? (res as any).data : [];
    },
  });

  // Filter voters by search query
  const filteredVoters = voters?.filter((voter: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      voter.name?.toLowerCase().includes(query) ||
      voter.email?.toLowerCase().includes(query) ||
      voter.mobile?.includes(query) ||
      voter.voterIdNumber?.toLowerCase().includes(query)
    );
  }) || [];

  // Stats
  const stats = {
    total: voters?.length || 0,
    verified: voters?.filter((v: any) => v.isVerified).length || 0,
    thisMonth: voters?.filter((v: any) => {
      const created = new Date(v.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registered Voters</h1>
        <p className="text-muted-foreground">View all registered voters in your ward</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Voters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IdCard className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, mobile, or voter ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Voters Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voter</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Voter ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading voters...
                  </TableCell>
                </TableRow>
              ) : filteredVoters.length > 0 ? (
                filteredVoters.map((voter: any) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {voter.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{voter.name}</p>
                          {voter.address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {voter.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {voter.email}
                        </p>
                        {voter.mobile && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {voter.mobile}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {voter.voterIdNumber ? (
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {voter.voterIdNumber}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {voter.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(voter.createdAt)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No voters match your search" : "No registered voters yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
