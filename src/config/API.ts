export const BASE_URL = "http://192.168.100.13:5038/api";

export const BASE_URL_PDF = "https://api.cholimexfood.com.vn/";

export const API_ENDPOINTS = {
  // AUTH
  LOGIN: `${BASE_URL}/Authorization/login`,
  REFRESH_TOKEN: `${BASE_URL}/Authorization/refresh-token`,
  GET_INFO: `${BASE_URL}/Common/get-info`,
  CHANGE_PASSWORD: `${BASE_URL}/Common/change-password`,
  GET_FIELD_ACTIVE: `${BASE_URL}/Common/get-fields-active`,
  GET_CLASS_BY_NAME: `${BASE_URL}/Common/get-class-by-name`,
  GET_CLASS_REFERENCE: `${BASE_URL}/Common/get-class-reference`,
  PREVIEW_ATTACH_PROPERTY: `${BASE_URL}/Common/preview-attach-property`,
  PREVIEW_MAYTINH_THONGKE_CNTT: `${BASE_URL}/MayTinh/thong-ke-cntt`,
  GET_CATEGORY_ENUM: `${BASE_URL}/Common/get-category-enum`,
  GET_CATEGORY: `${BASE_URL}/Common/get-category`,
  // PERMISSION
  GET_PERMISSION: `${BASE_URL}/Common/get-permission`,
  // CAMERA
  GET_VUNG_CAMERA_STEAM: `${BASE_URL}/VungCamera_ChiTiet/get-vung-camera-steam`,
  // GET TOKEN CAMERA
  GET_TOKEN_VIEW_CAMERA: `${BASE_URL}/Common/get-token-view-camera`,

  // HOA DON SO QUY
  HOADON_SO_QUY: `${BASE_URL}/HoaDonBan/so-quy`,

  // UPDATE FCM TOKEN
  UPDATE_FCM_TOKEN: `${BASE_URL}/Common/update-fcm-token`,

  // DANH SÁCH ĐẶT HÀNG CÀ PHÊ
  DANH_SACH_DAT_HANG_CA_PHE: `${BASE_URL}/DonDatHang/get-list-dat-hang-ban-ca-phe`,

  // DANH SÁCH ĐẶT HÀNG CÀ PHÊ CHI TIẾT
  CHI_TIET_DAT_HANG_CA_PHE: `${BASE_URL}/DonDatHang/get-list-dat-hang-ban-ca-phe-chi-tiet`,

  // UPDATE TRANG THAI PHUC VU
  UPDATE_TRANG_THAI_PHUC_VU: `${BASE_URL}/DonDatHang/update-trang-thai-phuc-vu-dat-hang-ban-ca-phe`,
};
