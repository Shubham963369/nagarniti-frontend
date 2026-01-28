const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Token storage (in memory for security, persisted via zustand for page refresh)
let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if we have an access token
    if (!skipAuth && accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      credentials: "include", // Still include cookies for refresh token
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }
  }

  async get<T>(endpoint: string, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, skipAuth);
  }

  async post<T>(endpoint: string, body?: unknown, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }, skipAuth);
  }

  async patch<T>(endpoint: string, body?: unknown, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }, skipAuth);
  }

  async delete<T>(endpoint: string, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" }, skipAuth);
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }, true), // skipAuth for login
  register: (data: {
    email: string;
    name: string;
    mobile?: string;
    voterId?: string;
    wardSlug: string;
    password: string;
    societyId?: number;
  }) => api.post("/api/auth/register", data, true), // skipAuth for register
  logout: () => api.post("/api/auth/logout"),
  logoutAll: () => api.post("/api/auth/logout-all"),
  refresh: () => api.post("/api/auth/refresh", undefined, true), // skipAuth for refresh (uses cookie)
  me: () => api.get("/api/auth/me"),
  getWardBySlug: (slug: string) => api.get(`/api/auth/ward/${slug}`, true), // public endpoint
  getWardSocieties: (slug: string) => api.get(`/api/auth/ward/${slug}/societies`, true), // public endpoint
  updateProfile: (data: { name: string; mobile?: string }) =>
    api.patch("/api/auth/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/api/auth/change-password", data),
  updateProfileImage: (profileImageUrl: string) =>
    api.patch("/api/auth/profile-image", { profileImageUrl }),
};

// Admin API (Super Admin)
export const adminApi = {
  getStats: () => api.get("/api/admin/stats"),
  getWards: () => api.get("/api/admin/wards"),
  createWard: (data: any) => api.post("/api/admin/wards", data),
  updateWard: (id: number, data: any) => api.patch(`/api/admin/wards/${id}`, data),
  deleteWard: (id: number) => api.delete(`/api/admin/wards/${id}`),
  getWardAdmins: () => api.get("/api/admin/ward-admins"),
  createWardAdmin: (data: any) => api.post("/api/admin/ward-admins", data),
  updateWardAdmin: (id: number, data: any) => api.patch(`/api/admin/ward-admins/${id}`, data),
  deleteWardAdmin: (id: number) => api.delete(`/api/admin/ward-admins/${id}`),
  getAnalytics: () => api.get("/api/admin/analytics"),
};

// Ward API (Ward Admin)
export const wardApi = {
  getStats: (wardId?: number) =>
    api.get(`/api/ward/stats${wardId ? `?wardId=${wardId}` : ""}`),
  getFunds: (wardId?: number) =>
    api.get(`/api/ward/funds${wardId ? `?wardId=${wardId}` : ""}`),
  createFund: (data: any) => api.post("/api/ward/funds", data),
  updateFund: (id: number, data: any) => api.patch(`/api/ward/funds/${id}`, data),
  deleteFund: (id: number) => api.delete(`/api/ward/funds/${id}`),
  getProjects: (wardId?: number) =>
    api.get(`/api/ward/projects${wardId ? `?wardId=${wardId}` : ""}`),
  getProject: (uuid: string) => api.get(`/api/ward/projects/${uuid}`),
  getProjectUpdates: (uuid: string) =>
    api.get(`/api/ward/projects/${uuid}/updates`),
  createProject: (data: any) => api.post("/api/ward/projects", data),
  updateProject: (id: number, data: any) => api.patch(`/api/ward/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/api/ward/projects/${id}`),
  addProjectUpdate: (projectId: number, data: any) =>
    api.post(`/api/ward/projects/${projectId}/updates`, data),
  createProjectUpdate: (projectId: number, data: any) =>
    api.post(`/api/ward/projects/${projectId}/updates`, data),
  getGrievances: (wardId?: number) =>
    api.get(`/api/ward/grievances${wardId ? `?wardId=${wardId}` : ""}`),
  getGrievance: (uuid: string) => api.get(`/api/ward/grievances/${uuid}`),
  updateGrievance: (uuid: string, data: any) => api.patch(`/api/ward/grievances/${uuid}`, data),
  getNotifications: (wardId?: number) =>
    api.get(`/api/ward/notifications${wardId ? `?wardId=${wardId}` : ""}`),
  createNotification: (data: any) => api.post("/api/ward/notifications", data),
  updateNotification: (id: number, data: any) => api.patch(`/api/ward/notifications/${id}`, data),
  deleteNotification: (id: number) => api.delete(`/api/ward/notifications/${id}`),
  getVoters: (wardId?: number) =>
    api.get(`/api/ward/voters${wardId ? `?wardId=${wardId}` : ""}`),
  // Society Management
  getSocieties: () => api.get("/api/ward/societies"),
  getSociety: (uuid: string) => api.get(`/api/ward/societies/${uuid}`),
  createSociety: (data: any) => api.post("/api/ward/societies", data),
  updateSociety: (uuid: string, data: any) => api.patch(`/api/ward/societies/${uuid}`, data),
  deleteSociety: (uuid: string) => api.delete(`/api/ward/societies/${uuid}`),
  getSocietyFunds: (uuid: string) => api.get(`/api/ward/societies/${uuid}/funds`),
  getSocietyFundAllocations: (uuid: string) => api.get(`/api/ward/societies/${uuid}/funds`),
  getSocietyProjects: (uuid: string) => api.get(`/api/ward/societies/${uuid}/projects`),
  getSocietyMembers: (uuid: string) => api.get(`/api/ward/societies/${uuid}/members`),
  allocateSocietyFund: (uuid: string, data: any) => api.post(`/api/ward/societies/${uuid}/funds`, data),
  removeSocietyFund: (uuid: string, allocationId: number) => api.delete(`/api/ward/societies/${uuid}/funds/${allocationId}`),
  addSocietyMember: (uuid: string, userId: number) => api.post(`/api/ward/societies/${uuid}/members`, { userId }),
  removeSocietyMember: (uuid: string, userId: number) => api.delete(`/api/ward/societies/${uuid}/members/${userId}`),
};

// Upload folder types
export type UploadFolder = "projects" | "grievances" | "wards" | "updates" | "profiles" | "documents";

// Upload API
export const uploadApi = {
  requestUploadUrl: (fileName: string, folder: UploadFolder) =>
    api.post<{ uploadUrl: string; filePath: string }>("/api/uploads/request-url", { fileName, folder }),
  completeUpload: (filePath: string) =>
    api.post<{ url: string }>("/api/uploads/complete", { filePath }),
};

// Helper function to upload a file
export async function uploadFile(
  file: File,
  folder: UploadFolder
): Promise<string | null> {
  try {
    // Get signed URL
    const urlResponse = await uploadApi.requestUploadUrl(file.name, folder) as any;
    if (!urlResponse.success) {
      console.error("Failed to get upload URL:", urlResponse.error);
      return null;
    }

    // Backend returns uploadUrl and filePath at top level, not nested in data
    const uploadUrl = urlResponse.uploadUrl || urlResponse.data?.uploadUrl;
    const filePath = urlResponse.filePath || urlResponse.data?.filePath;

    if (!uploadUrl || !filePath) {
      console.error("Missing uploadUrl or filePath in response");
      return null;
    }

    // Upload file directly to Supabase
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      console.error("Failed to upload file to storage");
      return null;
    }

    // Get public URL
    const completeResponse = await uploadApi.completeUpload(filePath) as any;
    if (!completeResponse.success) {
      console.error("Failed to complete upload:", completeResponse.error);
      return null;
    }

    // Backend returns url at top level
    const publicUrl = completeResponse.url || completeResponse.data?.url;
    return publicUrl || null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

// Voter API
export const voterApi = {
  getStats: () => api.get("/api/voter/stats"),
  getWard: () => api.get("/api/voter/ward"),
  getFunds: () => api.get("/api/voter/funds"),
  getProjects: (status?: string) =>
    api.get(`/api/voter/projects${status ? `?status=${status}` : ""}`),
  getProject: (uuid: string) => api.get(`/api/voter/projects/${uuid}`),
  getNotifications: () => api.get("/api/voter/notifications"),
  markNotificationRead: (id: number) => api.patch(`/api/voter/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => api.post("/api/voter/notifications/read-all", {}),
  getGrievances: (sortBy?: string, status?: string) => {
    const params = new URLSearchParams();
    if (sortBy) params.append("sortBy", sortBy);
    if (status) params.append("status", status);
    const query = params.toString();
    return api.get(`/api/voter/grievances${query ? `?${query}` : ""}`);
  },
  getGrievance: (uuid: string) => api.get(`/api/voter/grievances/${uuid}`),
  getMyGrievances: () => api.get("/api/voter/grievances/my"),
  submitGrievance: (data: any) => api.post("/api/voter/grievances", data),
  createGrievance: (data: any) => api.post("/api/voter/grievances", data),
  voteGrievance: (uuid: string, voteType: "upvote" | "downvote") =>
    api.post(`/api/voter/grievances/${uuid}/vote`, { voteType }),
  deleteGrievance: (uuid: string) => api.delete(`/api/voter/grievances/${uuid}`),
  // Society
  getMySociety: () => api.get("/api/voter/society"),
  getSocietyProjects: () => api.get("/api/voter/society/projects"),
  getSocietyFundAllocations: () => api.get("/api/voter/society/fund-allocations"),
  getSocietyMembers: () => api.get("/api/voter/society/members"),
  getProfile: () => api.get("/api/voter/society/profile"),
  getWardSocieties: () => api.get("/api/voter/societies"),
  joinSociety: (societyId: number) => api.patch("/api/voter/society/join", { societyId }),
};

// Comment API
export const commentApi = {
  getComments: (entityType: "project" | "grievance", entityId: number) =>
    api.get(`/api/comments/${entityType}/${entityId}`),
  createComment: (data: {
    entityType: "project" | "grievance";
    entityId: number;
    content: string;
    parentId?: number;
  }) => api.post("/api/comments", data),
  updateComment: (id: number, content: string) =>
    api.patch(`/api/comments/${id}`, { content }),
  deleteComment: (id: number) => api.delete(`/api/comments/${id}`),
};

// Fund Transactions API
export const fundTransactionsApi = {
  getTransactions: (fundId: number) =>
    api.get(`/api/fund-transactions/${fundId}`),
  getBalance: (fundId: number) =>
    api.get(`/api/fund-transactions/balance/${fundId}`),
  createTransaction: (data: {
    fundId: number;
    projectId?: number;
    type: "credit" | "debit" | "return" | "adjustment";
    amount: number;
    description: string;
    referenceNumber?: string;
  }) => api.post("/api/fund-transactions", data),
  allocateToProject: (data: {
    fundId: number;
    projectId: number;
    amount: number;
    description?: string;
  }) => api.post("/api/fund-transactions/allocate", data),
};
