"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, ClipboardList, Link as LinkIcon } from "lucide-react";

export default function WardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    area: "",
    registrationSlug: "",
    corporatorName: "",
    corporatorMobile: "",
    corporatorEmail: "",
  });

  const { data: wards, isLoading } = useQuery({
    queryKey: ["admin-wards"],
    queryFn: async () => {
      const res = await adminApi.getWards();
      return res.success ? (res as any).data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createWard(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward created successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-wards"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateWard(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-wards"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteWard(id),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-wards"] });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const openCreateDialog = () => {
    setEditingWard(null);
    setFormData({
      name: "",
      number: "",
      area: "",
      registrationSlug: "",
      corporatorName: "",
      corporatorMobile: "",
      corporatorEmail: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (ward: any) => {
    setEditingWard(ward);
    setFormData({
      name: ward.name,
      number: ward.number,
      area: ward.area || "",
      registrationSlug: ward.registrationSlug,
      corporatorName: ward.corporatorName || "",
      corporatorMobile: ward.corporatorMobile || "",
      corporatorEmail: ward.corporatorEmail || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingWard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWard) {
      updateMutation.mutate({ id: editingWard.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = () => {
    const slug = `${formData.name.toLowerCase().replace(/\s+/g, "-")}-${formData.number}`;
    setFormData({ ...formData, registrationSlug: slug });
  };

  const copyRegistrationLink = (slug: string) => {
    const link = `${window.location.origin}/register/${slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Registration link copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wards Management</h1>
          <p className="text-muted-foreground">Manage all wards in the system</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ward
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward</TableHead>
                <TableHead>Corporator</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Registration Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : wards?.length > 0 ? (
                wards.map((ward: any) => (
                  <TableRow key={ward.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ward.name}</p>
                        <p className="text-sm text-muted-foreground">Ward {ward.number}</p>
                        {ward.area && (
                          <p className="text-xs text-muted-foreground mt-1">{ward.area}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ward.corporatorName || "-"}</p>
                        <p className="text-sm text-muted-foreground">
                          {ward.corporatorMobile || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          {ward.projectsCount || 0} projects
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {ward.votersCount || 0} voters
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Funds: {formatCurrency(ward.totalFunds || 0)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyRegistrationLink(ward.registrationSlug)}
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(ward)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this ward?")) {
                            deleteMutation.mutate(ward.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No wards found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWard ? "Edit Ward" : "Add New Ward"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ward Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Worli"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Ward Number</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="e.g., 65"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area Description</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g., Worli, Prabhadevi, Lower Parel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationSlug">Registration Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="registrationSlug"
                    value={formData.registrationSlug}
                    onChange={(e) => setFormData({ ...formData, registrationSlug: e.target.value })}
                    placeholder="e.g., worli-65"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Link: /register/{formData.registrationSlug || "slug"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corporatorName">Corporator Name</Label>
                <Input
                  id="corporatorName"
                  value={formData.corporatorName}
                  onChange={(e) => setFormData({ ...formData, corporatorName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corporatorMobile">Mobile</Label>
                <Input
                  id="corporatorMobile"
                  value={formData.corporatorMobile}
                  onChange={(e) => setFormData({ ...formData, corporatorMobile: e.target.value })}
                  placeholder="10-digit mobile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corporatorEmail">Email</Label>
                <Input
                  id="corporatorEmail"
                  type="email"
                  value={formData.corporatorEmail}
                  onChange={(e) => setFormData({ ...formData, corporatorEmail: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingWard ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
