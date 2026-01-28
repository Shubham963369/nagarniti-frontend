import { Badge } from "@/components/ui/badge";

interface FundSourceBadgeProps {
  source: string;
}

const sourceConfig: Record<string, { className: string }> = {
  BMC: {
    className: "bg-purple-100 text-purple-800",
  },
  "State Government": {
    className: "bg-indigo-100 text-indigo-800",
  },
  "Central Government": {
    className: "bg-teal-100 text-teal-800",
  },
  "Corporator Fund": {
    className: "bg-orange-100 text-orange-800",
  },
  "MLA Fund": {
    className: "bg-blue-100 text-blue-800",
  },
  "MP Fund": {
    className: "bg-green-100 text-green-800",
  },
};

export function FundSourceBadge({ source }: FundSourceBadgeProps) {
  const config = sourceConfig[source] || { className: "bg-gray-100 text-gray-800" };
  return (
    <Badge variant="outline" className={`${config.className} border-0`}>
      {source}
    </Badge>
  );
}
