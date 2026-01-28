import { Badge } from "@/components/ui/badge";

type ProjectStatus = "proposed" | "approved" | "in_progress" | "completed" | "on_hold";
type GrievanceStatus = "pending" | "under_review" | "in_progress" | "resolved" | "rejected";

interface StatusBadgeProps {
  status: ProjectStatus | GrievanceStatus | string;
  type?: "project" | "grievance";
}

const projectStatusConfig: Record<string, { label: string; className: string }> = {
  proposed: {
    label: "Proposed",
    className: "bg-blue-100 text-blue-800",
  },
  approved: {
    label: "Approved",
    className: "bg-indigo-100 text-indigo-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-red-100 text-red-800",
  },
};

const grievanceStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-800",
  },
  under_review: {
    label: "Under Review",
    className: "bg-blue-100 text-blue-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-800",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
};

export function StatusBadge({ status, type = "project" }: StatusBadgeProps) {
  const config = type === "grievance"
    ? grievanceStatusConfig[status]
    : projectStatusConfig[status];

  if (!config) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-0">
        {status?.replace(/_/g, " ")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${config.className} border-0`}>
      {config.label}
    </Badge>
  );
}
