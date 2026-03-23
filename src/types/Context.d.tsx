export type LogoutReason = "EXPIRED" | "MANUAL" | "OTHER";

export type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  iosAuthenticated: boolean;
  authReady: boolean;

  setIosAuthenticated: (value: boolean) => void;
  setToken: (token: string | null) => Promise<void>;
  setRefreshToken: (token: string | null) => Promise<void>;
  logout: (reason?: LogoutReason) => Promise<void>;

  logoutReason?: LogoutReason;
  clearLogoutReason: () => void;
};
