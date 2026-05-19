import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { formatTien, mapApiItem } from "../../utils/Helper";
import { ChiTietApiItem, DatHangApiItem } from "../../types/Api.d";
import { useAppRefetch } from "../../hooks/useAppRefetch";
import { warn } from "../../utils/Logger";
import ScreenStateView from "../../components/ui/ScreenStateView";
import { fetchCafeOrdersWithDetails } from "../../services/data/CafeOrderData";
import { colors } from "../../constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChiTietHienThi {
  tenSanPham: string;
  soLuong: number;
  giaTien: number;
}

interface PhieuDaLenMon {
  id: string;
  maSo: string;
  ngayDuyet: string;
  viTri: string;
  nguoiDuyet: string;
  tongTienPhieu: number;
  danhSachMon: ChiTietHienThi[];
}

// ─── API response types ───────────────────────────────────────────────────────

type ChiTietDaLenMonApiItem = ChiTietApiItem & { giaTien?: number };

// ─── Map API data → PhieuDaLenMon ────────────────────────────────────────────

const mapToPhieu = (
  datHang: DatHangApiItem,
  chiTiet: ChiTietDaLenMonApiItem[],
): PhieuDaLenMon => {
  const base = mapApiItem(datHang);

  return {
    id: base.id,
    maSo: base.maDatHang,
    ngayDuyet: `${base.ngay} ${base.thoiGian}`,
    viTri: base.viTri,
    nguoiDuyet: datHang.log_ID_User_MoTa || "—",
    tongTienPhieu: base.tongTien,
    danhSachMon: chiTiet.map((ct) => ({
      tenSanPham: ct.iD_SanPham_MoTa ?? "—",
      soLuong: ct.soLuong ?? 0,
      giaTien: ct.giaTien ?? 0,
    })),
  };
};

// ─── Item ─────────────────────────────────────────────────────────────────────

const PhieuItem: React.FC<{ item: PhieuDaLenMon; index: number }> = ({
  item,
  index,
}) => (
  <View style={styles.card}>
    {/* Top row */}
    <View style={styles.cardTopRow}>
      <View style={styles.sttBadge}>
        <Text style={styles.sttText}>#{index + 1}</Text>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Đã lên món</Text>
      </View>
    </View>

    {/* Mã + ngày giờ */}
    <View style={styles.row}>
      <Text style={styles.maSo}>{item.maSo}</Text>
      <Text style={styles.ngay}>{item.ngayDuyet}</Text>
    </View>

    <View style={styles.separator} />

    {/* Vị trí */}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Vị trí</Text>
      <Text style={styles.infoValue}>{item.viTri}</Text>
    </View>

    {/* Người duyệt */}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Người duyệt</Text>
      <Text style={styles.infoValue}>{item.nguoiDuyet}</Text>
    </View>

    <View style={styles.separator} />

    {/* Danh sách món */}
    {item.danhSachMon.length === 0 ? (
      <Text style={styles.noMon}>Không có món</Text>
    ) : (
      item.danhSachMon.map((mon, idx) => (
        <View key={idx}>
          <View style={styles.monRow}>
            <Text style={styles.monTen} numberOfLines={2}>
              {mon.tenSanPham}
            </Text>
            <View style={styles.monRight}>
              <View style={styles.soLuongBadge}>
                <Text style={styles.soLuongText}>x{mon.soLuong}</Text>
              </View>
              <Text style={styles.monGia}>{formatTien(mon.giaTien)}</Text>
            </View>
          </View>
          {idx < item.danhSachMon.length - 1 && (
            <View style={styles.monDivider} />
          )}
        </View>
      ))
    )}

    <View style={styles.separator} />

    {/* Tổng tiền */}
    <View style={styles.tienRow}>
      <Text style={styles.tienLabel}>Tổng tiền</Text>
      <Text style={styles.tienValue}>{formatTien(item.tongTienPhieu)}</Text>
    </View>
  </View>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <ScreenStateView
    icon={<Text style={styles.emptyIcon}>🍽️</Text>}
    title="Chưa có món nào được lên"
    subtitle="Các phiếu đã duyệt sẽ hiện ở đây"
    containerStyle={styles.empty}
    titleStyle={styles.emptyTitle}
    subtitleStyle={styles.emptySub}
  />
);

// ─── Summary header ───────────────────────────────────────────────────────────

const SummaryHeader: React.FC<{ data: PhieuDaLenMon[] }> = ({ data }) => {
  const tongMon = data.reduce(
    (acc, i) => acc + i.danhSachMon.reduce((a, m) => a + m.soLuong, 0),
    0,
  );
  const tongTien = data.reduce((acc, i) => acc + i.tongTienPhieu, 0);

  return (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryNum}>{data.length}</Text>
        <Text style={styles.summaryLabel}>Phiếu</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryNum}>{tongMon}</Text>
        <Text style={styles.summaryLabel}>Món</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryNum}>{formatTien(tongTien)}</Text>
        <Text style={styles.summaryLabel}>Tổng tiền</Text>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const TRANG_THAI_DA_LEN_MON = 4;

const ListOfDishesAlreadyServed: React.FC = () => {
  const [data, setData] = useState<PhieuDaLenMon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const { orders, detailsByOrderId } = await fetchCafeOrdersWithDetails<
        DatHangApiItem,
        ChiTietDaLenMonApiItem
      >(TRANG_THAI_DA_LEN_MON);

      if (orders.length === 0) {
        setData([]);
        return;
      }

      const mapped: PhieuDaLenMon[] = orders.map((datHang) => {
        const chiTietCuaPhieu =
          datHang.id == null ? [] : detailsByOrderId.get(datHang.id) ?? [];
        return mapToPhieu(datHang, chiTietCuaPhieu);
      });

      setData(mapped);
    } catch (err) {
      warn("Lỗi fetch danh sách đã lên món:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useAppRefetch(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ScreenStateView loading color={TEAL} containerStyle={styles.center} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ScreenStateView title={error} titleStyle={styles.errorText} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Danh sách đã lên món</Text>
          <Text style={styles.sectionSub}>{data.length} phiếu · hôm nay</Text>
        </View>

        {data.length > 0 && <SummaryHeader data={data} />}

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          data.map((item, index) => (
            <View key={item.id}>
              <PhieuItem item={item} index={index} />
              {index < data.length - 1 && <View style={styles.itemSeparator} />}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const TEAL = colors.teal;
const TEAL_BG = colors.tealSoft;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  scrollView: { flex: 1, backgroundColor: "#F7F8FA" },
  center: { justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  itemSeparator: { height: 8 },
  errorText: { fontSize: 14, color: "#e53935", textAlign: "center" },

  listHeader: { paddingVertical: 12, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEAL,
    letterSpacing: 0.1,
  },
  sectionSub: { fontSize: 15, color: "#999", marginTop: 2 },

  summary: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: { fontSize: 15, fontWeight: "700", color: TEAL, marginBottom: 2 },
  summaryLabel: { fontSize: 15, color: "#999" },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5e5",
    marginVertical: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sttBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sttText: { fontSize: 15, fontWeight: "700", color: "#888" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#f57f17",
  },
  statusText: { fontSize: 15, fontWeight: "600", color: "#f57f17" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  maSo: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  ngay: { fontSize: 13, color: "#999" },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EFEFEF",
    marginVertical: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 15, color: "#888", flex: 1 },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
    textAlign: "right",
    flex: 2,
  },

  // Món
  monRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  monTen: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
    paddingRight: 8,
  },
  monRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monGia: {
    fontSize: 14,
    fontWeight: "600",
    color: TEAL,
    minWidth: 70,
    textAlign: "right",
  },
  monDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F0",
  },
  noMon: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    paddingVertical: 8,
  },

  soLuongBadge: {
    backgroundColor: TEAL_BG,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soLuongText: { fontSize: 13, fontWeight: "700", color: TEAL },

  tienRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  tienLabel: { fontSize: 15, color: "#888", fontWeight: "500" },
  tienValue: { fontSize: 16, fontWeight: "700", color: TEAL },

  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: "#999" },
  // Thêm style
  listContentEmpty: { flexGrow: 1 },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // ← căn giữa dọc
    paddingTop: 0, // ← bỏ paddingTop cũ
  },
});

export default ListOfDishesAlreadyServed;
