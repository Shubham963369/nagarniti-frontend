"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, User, Mail, Phone } from "lucide-react";

export default function WardAdminsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    wardId: "",
  });

  const { data: wardAdmins, isLoading } = useQuery({
    queryKey: ["admin-ward-admins"],
    queryFn: async () => {
      const res = await adminApi.getWardAdmins();
      return res.success ? (res as any).data : [];
    },
  });

  const { data: wards } = useQuery({
    queryKey: ["admin-wards"],
    queryFn: async () => {
      const res = await adminApi.getWards();
      return res.success ? (res as any).data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createWardAdmin(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward admin created successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-ward-admins"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateWardAdmin(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward admin updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-ward-admins"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteWardAdmin(id),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Ward admin deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-ward-admins"] });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const openCreateDialog = () => {
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      wardId: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile || "",
      password: "",
      wardId: admin.wardId?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      wardId: formData.wardId ? parseInt(formData.wardId) : null,
    };

    if (editingAdmin) {
      // Remove password if empty (not updating)
      if (!submitData.password) {
        delete (submitData as any).password;
      }
      updateMutation.mutate({ id: editingAdmin.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Get assigned wards to show which are available
  const assignedWardIds = new Set(wardAdmins?.map((a: any) => a.wardId) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ward Admins Management</h1>
          <p className="text-muted-foreground">Manage corporators and ward administrators</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ward Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Assigned Ward</TableHead>
                <TableHead>Joined</TableHead>
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
              ) : wardAdmins?.length > 0 ? (
                wardAdmins.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <Badge variant="outline" className="text-xs">
                            Ward Admin
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </p>
                        {admin.mobile && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {admin.mobile}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.ward ? (
                        <div>
                          <p className="font-medium">{admin.ward.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Ward {admin.ward.number}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">Not Assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(admin.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(admin)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this ward admin?")) {
                            deleteMutation.mutate(admin.id);
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
                    No ward admins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? "Edit Ward Admin" : "Add New Ward Admin"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingAdmin && "(leave empty to keep current)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingAdmin ? "••••••••" : "Enter password"}
                required={!editingAdmin}
                minLength={6}
                maxLength={72}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wardId">Assign Ward</Label>
              <Select
                value={formData.wardId}
                onValueChange={(value) => setFormData({ ...formData, wardId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards?.map((ward: any) => (
                    <SelectItem
                      key={ward.id}
                      value={ward.id.toString()}
                      disabled={assignedWardIds.has(ward.id) && editingAdmin?.wardId !== ward.id}
                    >
                      {ward.name} (Ward {ward.number})
                      {assignedWardIds.has(ward.id) && editingAdmin?.wardId !== ward.id && " - Assigned"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingAdmin ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
