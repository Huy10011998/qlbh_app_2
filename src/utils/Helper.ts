import md5 from "react-native-md5";
import { QuickFilter } from "../types/Api.d";

// Hash MD5
export function md5Hash(input: string): string {
  return md5.hex_md5(input);
}

// Promise với timeout
export const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });

// Format date
export const fmt = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

// Format date ngắn gọn (không có năm)
const fmtShort = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

// Lấy ngày hôm nay, hôm qua, ... (dùng cho filter nhanh)
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Format tiền (đồng)
export const formatMoney = (n: number): string => {
  if (n === 0) return "0";

  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Lấy khoảng thời gian từ filter nhanh
export const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

// Lấy khoảng thời gian từ filter nhanh
export const endOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
};

// Lấy khoảng thời gian từ filter nhanh
export const getDateRange = (
  filter: QuickFilter,
  fromDate: Date,
  toDate: Date,
): [Date, Date] => {
  const now = new Date();

  switch (filter) {
    case "today":
      return [now, now];

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return [yesterday, yesterday];
    }

    case "thisWeek": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Thứ 2
      return [start, now];
    }

    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return [start, now];
    }

    case "custom":
      return [fromDate, toDate];

    default:
      return [now, now];
  }
};

// Helper.ts — thêm hàm này
export const toLocalISOString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}.000`
  );
};

// Lấy subtitle cho header dựa trên filter nhanh
export const getHeaderSubtitle = (
  q: QuickFilter,
  from: Date,
  to: Date,
): string => {
  switch (q) {
    case "today":
      return `Hôm nay · ${fmt(new Date())}`;
    case "yesterday":
      return `Hôm qua · ${fmt(daysAgo(1))}`;
    case "thisWeek":
      return `${fmtShort(from)} – ${fmtShort(to)}/${to.getFullYear()}`;
    case "thisMonth": {
      const t = new Date();
      return `Tháng ${t.getMonth() + 1}/${t.getFullYear()}`;
    }
    default: {
      const sameYear = from.getFullYear() === to.getFullYear();
      return sameYear
        ? `${fmtShort(from)} – ${fmt(to)}`
        : `${fmt(from)} – ${fmt(to)}`;
    }
  }
};
