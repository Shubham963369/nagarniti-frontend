"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { CommentItem } from "./comment-item";
import { MessageSquare, Loader2 } from "lucide-react";

interface CommentSectionProps {
  entityType: "project" | "grievance";
  entityId?: number;
  className?: string;
}

export function CommentSection({ entityType, entityId, className }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const queryKey = ["comments", entityType, entityId];

  const { data: commentsData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId) return [];
      const res = await commentApi.getComments(entityType, entityId);
      return res.success ? (res as any).data : [];
    },
    enabled: !!entityId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: number }) => {
      if (!entityId) throw new Error("Entity ID is required");
      return commentApi.createComment({
        entityType,
        entityId,
        content: data.content,
        parentId: data.parentId,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey });
        setNewComment("");
      } else {
        toast.error(res.error || "Failed to post comment");
      }
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      commentApi.updateComment(id, content),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey });
        toast.success("Comment updated");
      } else {
        toast.error(res.error || "Failed to update comment");
      }
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commentApi.deleteComment(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey });
        toast.success("Comment deleted");
      } else {
        toast.error(res.error || "Failed to delete comment");
      }
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && entityId) {
      createMutation.mutate({ content: newComment.trim() });
    }
  };

  const handleReply = (parentId: number, content: string) => {
    if (entityId) {
      createMutation.mutate({ content, parentId });
    }
  };

  const handleEdit = (commentId: number, content: string) => {
    updateMutation.mutate({ id: commentId, content });
  };

  const handleDelete = (commentId: number) => {
    deleteMutation.mutate(commentId);
  };

  // Don't render if entityId is not available
  if (!entityId) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  const comments = commentsData || [];
  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px] mb-2"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !newComment.trim()}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Comment"
          )}
        </Button>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
