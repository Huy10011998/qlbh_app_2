import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { API_ENDPOINTS } from "../../config/API";
import { ApiResponse, DatHangApiItem } from "../../types/Api.d";
import { log, warn } from "../../utils/Logger";
import { callApi, fetchCurrentUserId, getStoredUserId } from "./ApiClient";

export {
  api,
  callApi,
  clearTokenStorage,
  fetchCurrentUserId,
  getStoredUserId,
  hardResetApi,
  refreshTokenFlow,
  resetAuthState,
  resetRefreshState,
  setOnAuthLogout,
  setRefreshInApi,
  setStoredUserId,
  setTokenInApi,
} from "./ApiClient";

type ApiListResponse<TItem> = {
  data?: { items?: TItem[] };
};

type DatHangFilterBody = {
  orderby: null;
  pageSize: null;
  skipSize: null;
  conditions: Array<{
    property: string;
    operator: number;
    value: string | number | number[];
    type: number;
  }>;
  searchText: null;
  conditionsAll: [];
};

type FcmUpdateResponse = {
  success?: boolean;
  message?: string;
};

export const soquy = async <T = ApiResponse>(tuNgay: string, denNgay: string) =>
  callApi<T>("POST", API_ENDPOINTS.HOADON_SO_QUY, {
    tuNgay,
    denNgay,
    isSum: true,
  });

export const updateFCMToken = async <T = FcmUpdateResponse>(
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
  } catch (error) {
    warn("[API] updateFCMToken failed", error);
  }
};

const buildDatHangCaPheBody = (trangthai: number): DatHangFilterBody => {
  const now = new Date();
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnNow = new Date(now.getTime() + vnOffsetMs);

  const yyyy = vnNow.getUTCFullYear();
  const mm = vnNow.getUTCMonth();
  const dd = vnNow.getUTCDate();

  const startOfDayVN = new Date(Date.UTC(yyyy, mm, dd) - vnOffsetMs);
  const endOfDayVN = new Date(Date.UTC(yyyy, mm, dd + 1) - vnOffsetMs);

  return {
    orderby: null,
    pageSize: null,
    skipSize: null,
    conditions: [
      {
        property: "NgayDatHang",
        operator: 2,
        value: startOfDayVN.toISOString(),
        type: 7,
      },
      {
        property: "NgayDatHang",
        operator: 5,
        value: endOfDayVN.toISOString(),
        type: 7,
      },
      {
        property: "ID_TrangThaiPhucVu",
        operator: 0,
        value: trangthai,
        type: 2,
      },
    ],
    searchText: null,
    conditionsAll: [],
  };
};

export const danhSachDatHangCaPhe = async <T = ApiListResponse<DatHangApiItem>>(
  trangthai: number,
) =>
  callApi<T>(
    "POST",
    API_ENDPOINTS.DANH_SACH_DAT_HANG_CA_PHE,
    buildDatHangCaPheBody(trangthai),
  );

const buildDatHangCaPheChiTietBody = (ids: number[]): DatHangFilterBody => ({
  orderby: null,
  pageSize: null,
  skipSize: null,
  conditions: [
    {
      property: "ID_DatHang_BanCaPhe",
      operator: 10,
      value: ids,
      type: 11,
    },
  ],
  searchText: null,
  conditionsAll: [],
});

export const danhSachDatHangCaPheChiTiet = async <T = ApiListResponse<unknown>>(
  ids: number[],
) =>
  callApi<T>(
    "POST",
    API_ENDPOINTS.CHI_TIET_DAT_HANG_CA_PHE,
    buildDatHangCaPheChiTietBody(ids),
  );

export const updateTrangThaiPhucVu = async <T = unknown>(
  ids: number[],
  iD_TrangThaiPhucVu: number,
) =>
  callApi<T>("POST", API_ENDPOINTS.UPDATE_TRANG_THAI_PHUC_VU, {
    iDs: ids.join(","),
    iD_TrangThaiPhucVu,
  });
