import axios, { AxiosError, AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS, BASE_URL } from "../../config/Index";
import { log, warn } from "../../utils/Logger";
import { LogoutReason } from "../../types/Context.d";
import { withTimeout } from "../../utils/Helper";

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
