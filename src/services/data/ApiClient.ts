import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";
import { API_ENDPOINTS, BASE_URL } from "../../config/API";
import { LogoutReason } from "../../types/Context.d";
import { withTimeout } from "../../utils/Helper";
import { log, warn } from "../../utils/Logger";

const USER_ID_STORAGE_KEY = "userId";

type RefreshTokenResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

type CurrentUserResponse = {
  data?: {
    iD_User?: number | string;
    ID_User?: number | string;
    userId?: number | string;
    id?: number | string;
    ID?: number | string;
  };
};

type NeedLoginError = Error & { NEED_LOGIN: true };
type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };
type ApiError = AxiosError & { NEED_LOGIN?: boolean; OFFLINE?: boolean };

let onAuthLogout: ((reason?: LogoutReason) => Promise<void>) | null = null;
let cachedToken: string | null = null;
let cachedRefresh: string | null = null;
let isRefreshing = false;
let isLoggingOut = false;
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: ((token: string | null) => void)[] = [];

export const setOnAuthLogout = (
  cb: ((reason?: LogoutReason) => Promise<void>) | null,
) => {
  onAuthLogout = cb;
};

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
    const response = await callApi<CurrentUserResponse>(
      "POST",
      API_ENDPOINTS.GET_INFO,
      {},
    );
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
  } catch (error) {
    warn("[API] fetchCurrentUserId failed", error);
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

const createNeedLoginError = (): NeedLoginError =>
  Object.assign(new Error("NEED_LOGIN"), { NEED_LOGIN: true as const });

const throwNeedLogin = (): never => {
  throw createNeedLoginError();
};

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const runAuthLogout = async () => {
  if (isLoggingOut) return;

  isLoggingOut = true;
  try {
    await onAuthLogout?.("EXPIRED");
  } finally {
    isLoggingOut = false;
  }
};

export const refreshTokenFlow = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const promise = (async (): Promise<string> => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throwNeedLogin();

      const res = await withTimeout(
        refreshApi.post<RefreshTokenResponse>(API_ENDPOINTS.REFRESH_TOKEN, {
          value: refreshToken,
        }),
        8000,
      );

      const data = res?.data?.data;
      const accessToken = data?.accessToken ?? "";
      if (!accessToken) {
        throwNeedLogin();
      }

      await AsyncStorage.setItem("token", accessToken);
      setTokenInApi(accessToken);

      const nextRefreshToken = data?.refreshToken;
      if (nextRefreshToken) {
        await AsyncStorage.setItem("refreshToken", nextRefreshToken);
        cachedRefresh = nextRefreshToken;
      }

      log("[API] Refresh token success");
      return accessToken;
    } catch (error) {
      const err = error as AxiosError & { NEED_LOGIN?: boolean };
      if (!err.response) {
        warn("[API] Refresh failed due to network");
        throw err;
      }

      const status = err.response.status;
      if (status === 401 || status === 403 || err.NEED_LOGIN) {
        await clearTokenStorage();
        throwNeedLogin();
      }

      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  refreshPromise = promise;
  return promise;
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: ApiError) => {
    const originalRequest = err.config as RetriableRequestConfig | undefined;

    if (!err.response) {
      return Promise.reject(err);
    }

    if (err.NEED_LOGIN) {
      warn("[API] NEED_LOGIN -> logout");
      await runAuthLogout();
      return Promise.reject(err);
    }

    if (
      err.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(err);
    }

    originalRequest._retry = true;
    warn("[API] 401 -> try refresh");

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(createNeedLoginError());
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
    } catch (refreshError) {
      const errRefresh = refreshError as NeedLoginError;
      onRefreshed(null);

      if (errRefresh.NEED_LOGIN) {
        warn("[API] Refresh expired -> logout");
        await runAuthLogout();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const callApi = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown,
  configOverride?: AxiosRequestConfig,
): Promise<T> => {
  log("API REQUEST:", {
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

    log("API RESPONSE:", {
      url,
      data: response.data,
      status: response.status,
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    log("API ERROR:", {
      url,
      method,
      requestData: data,
      status: err.response?.status,
      response: err.response?.data,
      message: err.message,
    });

    throw error;
  }
};
