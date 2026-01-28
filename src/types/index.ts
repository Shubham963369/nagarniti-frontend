// User types
export interface User {
  id: number;
  mobile: string;
  name: string;
  email?: string;
  voterId?: string;
  role: "super_admin" | "ward_admin" | "voter";
  wardId: number | null;
  ward?: Ward;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// Ward types
export interface Ward {
  id: number;
  name: string;
  number: string;
  area?: string;
  registrationSlug: string;
  corporatorName?: string;
  corporatorMobile?: string;
  corporatorEmail?: string;
  imageUrl?: string;
  totalBudget: string;
  isActive: boolean;
  createdAt: string;
}

// Fund types
export interface Fund {
  id: number;
  wardId: number;
  amount: string;
  source: string;
  purpose?: string;
  financialYear: string;
  receivedDate: string;
  sanctionOrderNumber?: string;
  documentUrl?: string;
  remarks?: string;
  createdAt: string;
}

// Project types
export interface Project {
  id: number;
  wardId: number;
  title: string;
  description?: string;
  category: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  contractorName?: string;
  contractorContact?: string;
  estimatedCost?: string;
  actualCost?: string;
  fundSource?: string;
  fundId?: number;
  status: string;
  percentComplete: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  imageUrl?: string;
  updates?: ProjectUpdate[];
  createdAt: string;
}

export interface ProjectUpdate {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status?: string;
  percentComplete?: number;
  imageUrls: string[];
  createdAt: string;
}

// Grievance types
export interface Grievance {
  id: number;
  userId: number;
  wardId: number;
  title: string;
  description: string;
  category: string;
  location?: string;
  imageUrls: string[];
  status: string;
  priority?: string;
  isPublic: boolean;
  upvoteCount: number;
  downvoteCount: number;
  adminResponse?: string;
  respondedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  };
  userVote?: "upvote" | "downvote" | null;
}

// Notification types
export interface Notification {
  id: number;
  wardId?: number;
  title: string;
  message: string;
  type: string;
  isGlobal: boolean;
  imageUrl?: string;
  linkUrl?: string;
  createdAt: string;
}

// Stats types
export interface SuperAdminStats {
  totalWards: number;
  totalFunds: string;
  totalSpent: string;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  totalVoters: number;
  totalGrievances: number;
  pendingGrievances: number;
}

export interface WardAdminStats {
  wardId: number;
  wardName: string;
  totalFunds: string;
  totalSpent: string;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  totalVoters: number;
  totalGrievances: number;
  pendingGrievances: number;
}

export interface VoterStats {
  wardId: number;
  wardName: string;
  totalFunds: string;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
}

// Analytics types
export interface Analytics {
  fundsBySource: { source: string; total: string }[];
  projectsByStatus: { status: string; count: number }[];
  projectsByCategory: { category: string; count: number }[];
  fundsByWard: { wardId: number; wardName: string; wardNumber: string; total: string }[];
  grievancesByStatus: { status: string; count: number }[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
