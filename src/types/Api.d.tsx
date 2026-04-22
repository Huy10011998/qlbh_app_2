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
