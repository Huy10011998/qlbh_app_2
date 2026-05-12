export interface LoginResponse {
  refreshToken: null;
  accessToken: any;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export type Transaction = {
  id: string;
  type: "thu" | "chi";
  category: string;
  name: string;
  date: string;
  dateObj: Date;
  amount: number;
};

export type ApiItem = {
  [x: string]: any;
  text: string;
  loai: string;
  ngay: string | null;
  tongTien: number;
};

export type ApiResponse = {
  data: ApiItem[];
};

export type QuickFilter =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "custom";
export type TypeFilter = "all" | "thu" | "chi";

export interface ChiTietItem {
  tenHang: string;
  soLuong: number;
}

export interface ChungTu {
  id: string;
  rawId: number;
  maDatHang: string;
  ngay: string;
  thoiGian: string;
  viTri: string;
  trangThai: string;
  tongTien: number;
  iD_TrangThaiPhucVu: number;
  chiTiet: ChiTietItem[];
}

export interface DatHangApiItem {
  log_ID_User_MoTa: string;
  id?: number;
  maDatHang?: string;
  ngayDatHang?: string;
  iD_BanCaPhe_MoTa?: string;
  iD_TrangThaiPhucVu_MoTa?: string;
  iD_TrangThaiPhucVu?: number;
  tongTien?: number;
  thongTinDat?: string;
}

export interface ChiTietApiItem {
  iD_DatHang_BanCaPhe?: number; // foreign key → id của đơn hàng
  iD_SanPham_MoTa?: string;
  tenSanPham?: string; // fallback tên
  soLuong?: number;
  donViTinh?: string; // fallback đơn vị
}
