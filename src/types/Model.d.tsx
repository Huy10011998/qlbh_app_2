// Thông tin người dùng rút gọn
export interface UserInfo {
  userName?: string;
  moTa?: string;
  avatarUrl?: string;
}

// Dữ liệu người dùng cơ bản
export interface User {
  moTa?: string;
  email?: string;
  donVi?: string;
  phongBan?: string;
  boPhan?: string;
  toNhom?: string;
  chucVu?: string;
  chucDanh?: string;
  avatarUrl?: string;
}
