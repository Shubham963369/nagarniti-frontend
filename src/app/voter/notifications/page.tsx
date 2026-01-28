"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { voterApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, CheckCheck, AlertCircle, Info, Megaphone } from "lucide-react";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "alert":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "announcement":
      return <Megaphone className="h-5 w-5 text-blue-500" />;
    case "project_update":
      return <Info className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-primary" />;
  }
};

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

export default function VoterNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["voter-notifications"],
    queryFn: async () => {
      const res = await voterApi.getNotifications();
      return res.success ? (res as any).data : [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => voterApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voter-notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => voterApi.markAllNotificationsRead(),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "All notifications marked as read" });
        queryClient.invalidateQueries({ queryKey: ["voter-notifications"] });
      }
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  // Group by date
  const groupedNotifications = notifications?.reduce((groups: any, notification: any) => {
    const date = new Date(notification.createdAt).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <p className="text-muted-foreground">
            Stay updated with ward announcements and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardContent className="pt-4 pb-4">
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
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-8 w-8 text-orange-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <p className="text-sm text-muted-foreground">Unread</p>
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
                  <Card
                    key={notification.id}
                    className={`transition-all ${
                      !notification.isRead ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getTypeIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{notification.title}</h4>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 bg-primary rounded-full"></span>
                                )}
                              </div>
                              <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                                {notification.type?.replace("_", " ") || "general"}
                              </Badge>
                            </div>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markReadMutation.mutate(notification.id)}
                                disabled={markReadMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll be notified about ward updates here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
