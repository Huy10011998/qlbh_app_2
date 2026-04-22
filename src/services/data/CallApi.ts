import axios, { AxiosError, AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { log, warn } from "../../utils/Logger";
import { LogoutReason } from "../../types/Context.d";
import { withTimeout } from "../../utils/Helper";
import { API_ENDPOINTS, BASE_URL } from "../../config/API";

const USER_ID_STORAGE_KEY = "userId";

// GLOBAL LOGOUT HANDLER
let onAuthLogout: ((reason?: LogoutReason) => Promise<void>) | null = null;

export const setOnAuthLogout = (
  cb: ((reason?: LogoutReason) => Promise<void>) | null,
) => {
  onAuthLogout = cb;
};

// AXIOS
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json;charset=UTF-8" },
});

const refreshApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json;charset=UTF-8" },
});

// IN-MEMORY CACHE
let cachedToken: string | null = null;
let cachedRefresh: string | null = null;

export const setTokenInApi = (token: string | null) => {
  cachedToken = token;
};

export const setRefreshInApi = (refresh: string | null) => {
  cachedRefresh = refresh;
};

const getToken = async () => {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem("token");
  return cachedToken;
};

const getRefreshToken = async () => {
  if (cachedRefresh) return cachedRefresh;
  cachedRefresh = await AsyncStorage.getItem("refreshToken");
  return cachedRefresh;
};

export const clearTokenStorage = async () => {
  log("[API] Clearing cached tokens");
  cachedToken = null;
  cachedRefresh = null;
  await AsyncStorage.multiRemove(["token", "refreshToken"]);
};

export const setStoredUserId = async (userId: number | null) => {
  if (userId == null) {
    await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
  } else {
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
  }
};

export const getStoredUserId = async (): Promise<number | null> => {
  const stored = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
  if (!stored) return null;
  const value = Number(stored);
  return Number.isNaN(value) ? null : value;
};

export const fetchCurrentUserId = async (): Promise<number | null> => {
  const stored = await getStoredUserId();
  if (stored != null) return stored;

  try {
    const response = await callApi<any>("POST", API_ENDPOINTS.GET_INFO, {});
    const id =
      response?.data?.iD_User ??
      response?.data?.ID_User ??
      response?.data?.userId ??
      response?.data?.id ??
      response?.data?.ID ??
      null;

    if (id == null) return null;

    const parsed = Number(id);
    if (Number.isNaN(parsed)) return null;

    await setStoredUserId(parsed);
    return parsed;
  } catch (e: any) {
    warn("[API] fetchCurrentUserId failed", e);
    return null;
  }
};

export const resetRefreshState = () => {
  isRefreshing = false;
  refreshSubscribers = [];
  refreshPromise = null;
};

export const resetAuthState = () => {
  cachedToken = null;
  cachedRefresh = null;
  resetRefreshState();
  isLoggingOut = false;
};

export const hardResetApi = () => {
  log("[API] Hard reset API state");
  cachedToken = null;
  cachedRefresh = null;
  resetRefreshState();
};

const throwNeedLogin = (): never => {
  const e = new Error("NEED_LOGIN");
  (e as any).NEED_LOGIN = true;
  throw e;
};

// REFRESH FLOW
let isRefreshing = false;
let isLoggingOut = false;
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export const refreshTokenFlow = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throwNeedLogin();

      const res = await withTimeout(
        refreshApi.post(API_ENDPOINTS.REFRESH_TOKEN, {
          value: refreshToken,
        }),
        8000,
      );

      const data = res?.data?.data;
      if (!data?.accessToken) throwNeedLogin();

      await AsyncStorage.setItem("token", data.accessToken);
      setTokenInApi(data.accessToken);

      if (data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", data.refreshToken);
        cachedRefresh = data.refreshToken;
      }

      log("[API] Refresh token success");
      return data.accessToken;
    } catch (err: any) {
      if (!err.response) {
        warn("[API] Refresh failed due to network");
        throw err;
      }

      const status = err.response.status;
      if (status === 401 || status === 403 || err?.NEED_LOGIN) {
        await clearTokenStorage();
        throwNeedLogin();
      }

      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// REQUEST
api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & { NEED_LOGIN?: boolean; OFFLINE?: boolean }) => {
    const originalRequest: any = err.config;

    /** ===== NETWORK ERROR ===== */
    if (!err.response) {
      // KHÔNG gắn OFFLINE ở đây
      // để request tiếp theo / retry / refresh quyết định
      return Promise.reject(err);
    }

    /** ===== REFRESH FAILED HARD ===== */
    if (err.NEED_LOGIN) {
      warn("[API] NEED_LOGIN → logout");

      if (!isLoggingOut) {
        isLoggingOut = true;
        try {
          await onAuthLogout?.("EXPIRED");
        } finally {
          isLoggingOut = false; // 🔥 bắt buộc
        }
      }

      return Promise.reject(err);
    }

    /** ===== NOT 401 OR ALREADY RETRIED ===== */
    if (
      err.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(err);
    }

    originalRequest._retry = true;
    warn("[API] 401 → try refresh");

    /** ===== WAIT FOR REFRESH ===== */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(
              Object.assign(new Error("NEED_LOGIN"), { NEED_LOGIN: true }),
            );
            return;
          }

          resolve(
            api({
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              },
            }),
          );
        });
      });
    }

    /** ===== DO REFRESH ===== */
    isRefreshing = true;

    try {
      const newToken = await withTimeout(refreshTokenFlow(), 8000);
      onRefreshed(newToken);

      return api({
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch (refreshErr: any) {
      onRefreshed(null); // chỉ để resolve subscriber

      if (refreshErr?.NEED_LOGIN) {
        warn("[API] Refresh expired → logout");

        if (!isLoggingOut) {
          isLoggingOut = true;
          try {
            await onAuthLogout?.("EXPIRED");
          } finally {
            isLoggingOut = false;
          }
        }
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

// Generic API wrapper
export const callApi = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: any,
  configOverride?: any,
): Promise<T> => {
  log("🌐 API REQUEST:", {
    method,
    url,
    data,
    configOverride,
  });

  try {
    const response = await api.request<T>({
      method,
      url,
      data,
      ...configOverride,
    });

    log("✅ API RESPONSE:", {
      url,
      data: response.data,
      status: response.status,
    });

    return response.data;
  } catch (error: any) {
    log("❌ API ERROR:", {
      url,
      method,
      requestData: data,
      status: error?.response?.status,
      response: error?.response?.data,
      message: error.message,
    });

    throw error; // nhớ throw lại để screen handle
  }
};

// API functions
export const soquy = async <T = any>(tuNgay: string, denNgay: string) =>
  callApi<T>("POST", API_ENDPOINTS.HOADON_SO_QUY, {
    tuNgay,
    denNgay,
    isSum: true,
  });

export const updateFCMToken = async <T = any>(
  iD_User: number | null,
  fcmToken: string,
  platform: string,
  isActive: boolean,
  createdAt: string,
  updatedAt: string,
) =>
  callApi<T>("POST", API_ENDPOINTS.UPDATE_FCM_TOKEN, {
    iD_User: iD_User ?? 0,
    fcmToken,
    platform,
    isActive,
    createdAt,
    updatedAt,
  });

export const sendFCMActiveStatus = async (
  isActive: boolean,
  userId: number | null = null,
) => {
  try {
    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      warn("[API] No FCM token available");
      return;
    }

    const now = new Date().toISOString();
    const id =
      userId ?? (await getStoredUserId()) ?? (await fetchCurrentUserId());

    await updateFCMToken(id, fcmToken, Platform.OS, isActive, now, now);
    log("[API] updateFCMToken success", {
      iD_User: id,
      fcmToken,
      platform: Platform.OS,
      isActive,
    });
  } catch (e: any) {
    warn("[API] updateFCMToken failed", e);
  }
};
