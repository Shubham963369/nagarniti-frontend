import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, setAccessToken, getAccessToken, clearAccessToken } from "@/lib/api";

export interface User {
  id: number;
  email: string;
  name: string;
  mobile?: string;
  role: "super_admin" | "ward_admin" | "voter";
  wardId: number | null;
  profileImageUrl?: string;
  ward?: {
    id: number;
    name: string;
    number: string;
    registrationSlug?: string;
  };
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean; // Track if initial auth check is done
  isAuthenticated: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    name: string;
    mobile?: string;
    voterId?: string;
    wardSlug: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
}

// Token refresh timer
let refreshTimer: NodeJS.Timeout | null = null;

const scheduleTokenRefresh = (expiresIn: number, refreshFn: () => Promise<boolean>) => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // Refresh 1 minute before expiry (or at half time if less than 2 minutes)
  const refreshTime = expiresIn > 120 ? (expiresIn - 60) * 1000 : (expiresIn / 2) * 1000;

  refreshTimer = setTimeout(async () => {
    console.log("[Auth] Token refresh scheduled, refreshing...");
    await refreshFn();
  }, refreshTime);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Start with loading true
      isInitialized: false,
      isAuthenticated: false,
      error: null,
      tokenExpiresAt: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          if (response.success && (response as any).user) {
            const { user, accessToken, expiresIn } = response as any;

            // Store access token
            if (accessToken) {
              setAccessToken(accessToken);
              const tokenExpiresAt = Date.now() + expiresIn * 1000;
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                tokenExpiresAt,
              });

              // Schedule token refresh
              scheduleTokenRefresh(expiresIn, get().refreshToken);
            } else {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });
            }
            return true;
          } else {
            set({ error: response.error || "Login failed", isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: "Login failed", isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          if (response.success) {
            set({ isLoading: false });
            return true;
          } else {
            set({
              error: response.error || "Registration failed",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({ error: "Registration failed", isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          // Clear refresh timer
          if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
          }
          await authApi.logout();
        } finally {
          clearAccessToken();
          set({ user: null, isAuthenticated: false, tokenExpiresAt: null });
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refresh();
          if (response.success && (response as any).accessToken) {
            const { accessToken, expiresIn } = response as any;
            setAccessToken(accessToken);
            const tokenExpiresAt = Date.now() + expiresIn * 1000;
            set({ tokenExpiresAt });

            // Schedule next refresh
            scheduleTokenRefresh(expiresIn, get().refreshToken);
            console.log("[Auth] Token refreshed successfully");
            return true;
          } else {
            // Refresh failed, clear auth state
            console.log("[Auth] Token refresh failed, logging out");
            clearAccessToken();
            set({ user: null, isAuthenticated: false, tokenExpiresAt: null });
            return false;
          }
        } catch (error) {
          console.error("[Auth] Token refresh error:", error);
          clearAccessToken();
          set({ user: null, isAuthenticated: false, tokenExpiresAt: null });
          return false;
        }
      },

      checkAuth: async () => {
        // Don't set isLoading if already initialized - prevents flash
        const { isInitialized } = get();
        if (!isInitialized) {
          set({ isLoading: true });
        }

        try {
          // First try to refresh token using the httpOnly cookie
          console.log("[Auth] Checking auth, trying to refresh token...");
          const refreshResponse = await authApi.refresh();

          if (refreshResponse.success && (refreshResponse as any).accessToken) {
            console.log("[Auth] Refresh successful");
            const { accessToken, expiresIn } = refreshResponse as any;
            setAccessToken(accessToken);
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Schedule token refresh
            scheduleTokenRefresh(expiresIn, get().refreshToken);

            // Now get user data with the new access token
            const meResponse = await authApi.me();
            if (meResponse.success && (meResponse as any).user) {
              set({
                user: (meResponse as any).user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                tokenExpiresAt,
              });
              return;
            }
          }

          console.log("[Auth] Refresh failed or no refresh token, checking session...");

          // Fall back to session-based check (for backward compatibility)
          const response = await authApi.me();
          if (response.success && (response as any).user) {
            set({
              user: (response as any).user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            // Not authenticated
            console.log("[Auth] Not authenticated");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          }
        } catch (error) {
          console.error("[Auth] Check auth error:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "nagarniti-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokenExpiresAt: state.tokenExpiresAt,
        // Don't persist isInitialized - it should be false on fresh page load
      }),
      onRehydrateStorage: () => (state) => {
        // When state is rehydrated from localStorage, mark as not initialized
        // This ensures checkAuth runs on page load
        if (state) {
          state.isInitialized = false;
          state.isLoading = true;
        }
      },
    },
  ),
);
