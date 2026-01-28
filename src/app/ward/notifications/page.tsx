"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { wardApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Bell, Users, Calendar, Send } from "lucide-react";

const NOTIFICATION_TYPES = ["general", "project_update", "grievance_update", "announcement", "alert"];

const getTypeColor = (type: string) => {
  switch (type) {
    case "announcement":
      return "bg-blue-100 text-blue-800";
    case "alert":
      return "bg-red-100 text-red-800";
    case "project_update":
      return "bg-green-100 text-green-800";
    case "grievance_update":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["ward-notifications"],
    queryFn: async () => {
      const res = await wardApi.getNotifications();
      return res.success ? (res as any).data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => wardApi.createNotification(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Notification sent to all voters" });
        queryClient.invalidateQueries({ queryKey: ["ward-notifications"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => wardApi.updateNotification(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Notification updated" });
        queryClient.invalidateQueries({ queryKey: ["ward-notifications"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wardApi.deleteNotification(id),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Notification deleted" });
        queryClient.invalidateQueries({ queryKey: ["ward-notifications"] });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const openCreateDialog = () => {
    setEditingNotification(null);
    setFormData({
      title: "",
      message: "",
      type: "general",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (notification: any) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type || "general",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingNotification(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group by date
  const groupedNotifications = notifications?.reduce((groups: any, notification: any) => {
    const date = new Date(notification.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send updates and announcements to ward voters</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Send className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{notifications?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">All Voters</div>
                <p className="text-sm text-muted-foreground">Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Object.keys(groupedNotifications).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
        ) : Object.keys(groupedNotifications).length > 0 ? (
          Object.entries(groupedNotifications).map(([date, items]: [string, any]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-3">
                {items.map((notification: any) => (
                  <Card key={notification.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type?.replace("_", " ") || "general"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(notification)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this notification?")) {
                                deleteMutation.mutate(notification.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No notifications sent yet
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? "Edit Notification" : "Send New Notification"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your notification message..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingNotification ? "Update" : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
