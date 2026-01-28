"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  Reply,
  Pencil,
  Trash2,
  Check,
  X,
  Shield,
} from "lucide-react";

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    userId: number;
    userName: string;
    userRole: string;
    userProfileImage?: string | null;
    isAdminReply: boolean;
    createdAt: string;
    updatedAt: string;
    replies?: CommentItemProps["comment"][];
  };
  onReply: (parentId: number, content: string) => void;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  isReplying?: boolean;
  isPending?: boolean;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  isPending = false,
}: CommentItemProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplyingTo, setIsReplyingTo] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");

  const isOwnComment = user?.id === comment.userId;
  const isAdmin = user?.role === "ward_admin" || user?.role === "super_admin";
  const canDelete = isOwnComment || isAdmin;
  const canEdit = isOwnComment;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setIsReplyingTo(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className={`flex gap-3 ${comment.isAdminReply ? "bg-primary/5 p-3 rounded-lg" : ""}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.userProfileImage || undefined} alt={comment.userName} />
          <AvatarFallback>{comment.userName?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.userName}</span>
            {comment.isAdminReply && (
              <Badge variant="secondary" className="text-xs h-5">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsReplyingTo(!isReplyingTo)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Delete this comment?")) {
                      onDelete(comment.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Reply Input */}
          {isReplyingTo && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={isPending || !replyContent.trim()}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplyingTo(false);
                    setReplyContent("");
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 pl-4 border-l-2 border-muted space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={{ ...reply, replies: [] }}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
