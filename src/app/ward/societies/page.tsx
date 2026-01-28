"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { wardApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Search,
  Plus,
  Users,
  IndianRupee,
  ClipboardList,
  Pencil,
  Trash2,
  Eye,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";

interface Society {
  id: number;
  uuid: string;
  name: string;
  address: string;
  pincode: string;
  totalUnits: number;
  contactPerson: string;
  contactMobile: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  projectCount: number;
  totalFundAllocation: string;
}

export default function SocietiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    pincode: "",
    totalUnits: "",
    contactPerson: "",
    contactMobile: "",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: societies, isLoading } = useQuery({
    queryKey: ["ward-societies"],
    queryFn: async () => {
      const res = await wardApi.getSocieties();
      return res.success ? (res as any).data : [];
    },
  });

  const { data: societyDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["society-detail", selectedSociety?.uuid],
    queryFn: async () => {
      if (!selectedSociety?.uuid) return null;
      const res = await wardApi.getSociety(selectedSociety.uuid);
      return res.success ? (res as any).data : null;
    },
    enabled: !!selectedSociety?.uuid && isDetailOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => wardApi.createSociety(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Society created successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-societies"] });
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast({ title: "Failed to create society", description: res.error, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: any }) => wardApi.updateSociety(uuid, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Society updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-societies"] });
        setIsEditOpen(false);
        setSelectedSociety(null);
      } else {
        toast({ title: "Failed to update society", description: res.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => wardApi.deleteSociety(uuid),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Society deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-societies"] });
      } else {
        toast({ title: "Failed to delete society", description: res.error, variant: "destructive" });
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      pincode: "",
      totalUnits: "",
      contactPerson: "",
      contactMobile: "",
      isActive: true,
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : null,
    });
  };

  const handleUpdate = () => {
    if (!selectedSociety) return;
    updateMutation.mutate({
      uuid: selectedSociety.uuid,
      data: {
        ...formData,
        totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : null,
      },
    });
  };

  const handleEdit = (society: Society) => {
    setSelectedSociety(society);
    setFormData({
      name: society.name || "",
      address: society.address || "",
      pincode: society.pincode || "",
      totalUnits: society.totalUnits?.toString() || "",
      contactPerson: society.contactPerson || "",
      contactMobile: society.contactMobile || "",
      isActive: society.isActive,
    });
    setIsEditOpen(true);
  };

  const handleViewDetail = (society: Society) => {
    setSelectedSociety(society);
    setIsDetailOpen(true);
  };

  // Filter societies by search query
  const filteredSocieties = societies?.filter((society: Society) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      society.name?.toLowerCase().includes(query) ||
      society.address?.toLowerCase().includes(query) ||
      society.contactPerson?.toLowerCase().includes(query)
    );
  }) || [];

  // Stats
  const stats = {
    total: societies?.length || 0,
    active: societies?.filter((s: Society) => s.isActive).length || 0,
    totalMembers: societies?.reduce((sum: number, s: Society) => sum + (s.memberCount || 0), 0) || 0,
    totalFunds: societies?.reduce((sum: number, s: Society) => sum + parseFloat(s.totalFundAllocation || "0"), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Societies</h1>
          <p className="text-muted-foreground">Manage residential societies in your ward</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Society
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Society</DialogTitle>
              <DialogDescription>Create a new residential society in your ward</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Society Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Green Valley CHS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address of the society"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">Total Units</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Secretary/Chairman name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactMobile">Contact Mobile</Label>
                <Input
                  id="contactMobile"
                  value={formData.contactMobile}
                  onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Society
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Societies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalFunds)}</div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
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
            placeholder="Search by name, address, or contact..."
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

      {/* Societies Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Society</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-right">Funds Allocated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredSocieties.length > 0 ? (
                filteredSocieties.map((society: Society) => (
                  <TableRow key={society.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{society.name}</p>
                          {society.address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {society.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {society.contactPerson && (
                          <p className="text-sm">{society.contactPerson}</p>
                        )}
                        {society.contactMobile && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {society.contactMobile}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{society.memberCount || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{society.projectCount || 0}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600">
                        {formatCurrency(parseFloat(society.totalFundAllocation || "0"))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {society.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/ward/societies/${society.uuid}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(society)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this society?")) {
                              deleteMutation.mutate(society.uuid);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No societies match your search" : "No societies added yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Society</DialogTitle>
            <DialogDescription>Update society information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Society Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pincode">Pincode</Label>
                <Input
                  id="edit-pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-totalUnits">Total Units</Label>
                <Input
                  id="edit-totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactPerson">Contact Person</Label>
              <Input
                id="edit-contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactMobile">Contact Mobile</Label>
              <Input
                id="edit-contactMobile"
                value={formData.contactMobile}
                onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                maxLength={10}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Active Status</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedSociety?.name}
            </SheetTitle>
            <SheetDescription>
              Society details, members, and fund allocations
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : societyDetail ? (
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Information</h3>
                {societyDetail.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <p className="text-sm">{societyDetail.address}</p>
                  </div>
                )}
                {societyDetail.contactPerson && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{societyDetail.contactPerson}</p>
                  </div>
                )}
                {societyDetail.contactMobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{societyDetail.contactMobile}</p>
                  </div>
                )}
                {societyDetail.totalUnits && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{societyDetail.totalUnits} units</p>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Members ({societyDetail.members?.length || 0})
                </h3>
                {societyDetail.members?.length > 0 ? (
                  <div className="space-y-2">
                    {societyDetail.members.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {member.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.mobile}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No members registered</p>
                )}
              </div>

              {/* Fund Allocations */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Fund Allocations ({societyDetail.fundAllocations?.length || 0})
                </h3>
                {societyDetail.fundAllocations?.length > 0 ? (
                  <div className="space-y-2">
                    {societyDetail.fundAllocations.map((allocation: any) => (
                      <div key={allocation.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-600">
                            {formatCurrency(parseFloat(allocation.amount))}
                          </span>
                          <Badge variant="secondary">{allocation.financialYear}</Badge>
                        </div>
                        {allocation.purpose && (
                          <p className="text-sm text-muted-foreground mt-1">{allocation.purpose}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {allocation.fund?.source} - {allocation.fund?.purpose}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No fund allocations</p>
                )}
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Projects ({societyDetail.projects?.length || 0})
                </h3>
                {societyDetail.projects?.length > 0 ? (
                  <div className="space-y-2">
                    {societyDetail.projects.map((project: any) => (
                      <div key={project.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{project.title}</span>
                          <Badge
                            className={
                              project.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : project.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {project.status?.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{project.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No projects assigned</p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
