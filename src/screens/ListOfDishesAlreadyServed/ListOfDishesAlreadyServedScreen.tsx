import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhieuDaLenMon {
  id: string;
  maSo: string;
  ngayDuyet: string; // thời điểm được duyệt / lên món
  viTri: string; // Bàn 1, Sân 2…
  tenSanPham: string;
  soLuong: number;
  donVi: string;
  nguoiDuyet: string;
  soTien: number;
}

// ─── Mock data (chỉ các phiếu trạng thái "da_len_mon") ────────────────────────

const danhSachDaLenMon: PhieuDaLenMon[] = [
  {
    id: "1",
    maSo: "DCP-1958",
    ngayDuyet: "20/04/2026 10:05",
    viTri: "Bàn 1",
    tenSanPham: "Ép ổi",
    soLuong: 2,
    donVi: "Ly",
    nguoiDuyet: "Nguyễn Văn A",
    soTien: 45000,
  },
  {
    id: "2",
    maSo: "DCP-1959",
    ngayDuyet: "20/04/2026 10:12",
    viTri: "Sân 2",
    tenSanPham: "Nước suối",
    soLuong: 5,
    donVi: "Chai",
    nguoiDuyet: "Trần Thị B",
    soTien: 25000,
  },
  {
    id: "3",
    maSo: "DCP-1960",
    ngayDuyet: "20/04/2026 10:28",
    viTri: "Sân 1",
    tenSanPham: "Coca-cola",
    soLuong: 3,
    donVi: "Lon",
    nguoiDuyet: "Nguyễn Văn A",
    soTien: 30000,
  },
  {
    id: "4",
    maSo: "DCP-1961",
    ngayDuyet: "20/04/2026 10:45",
    viTri: "Bàn 3",
    tenSanPham: "Bò húc",
    soLuong: 4,
    donVi: "Lon",
    nguoiDuyet: "Lê Văn C",
    soTien: 60000,
  },
  {
    id: "5",
    maSo: "DCP-1955",
    ngayDuyet: "20/04/2026 09:50",
    viTri: "Sân 4",
    tenSanPham: "Pepsi",
    soLuong: 6,
    donVi: "Lon",
    nguoiDuyet: "Trần Thị B",
    soTien: 48000,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTien = (so: number): string => so.toLocaleString("vi-VN") + " đ";

// ─── Item ─────────────────────────────────────────────────────────────────────

const PhieuItem: React.FC<{ item: PhieuDaLenMon; index: number }> = ({
  item,
  index,
}) => (
  <View style={styles.card}>
    {/* Badge STT góc trái + badge "Đã lên món" góc phải */}
    <View style={styles.cardTopRow}>
      <View style={styles.sttBadge}>
        <Text style={styles.sttText}>#{index + 1}</Text>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Đã lên món</Text>
      </View>
    </View>

    {/* Mã phiếu + Ngày duyệt */}
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

    {/* Sản phẩm */}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Sản phẩm</Text>
      <Text style={styles.infoValue}>{item.tenSanPham}</Text>
    </View>

    {/* Số lượng */}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Số lượng</Text>
      <View style={styles.soLuongBadge}>
        <Text style={styles.soLuongText}>
          {item.soLuong} {item.donVi}
        </Text>
      </View>
    </View>

    {/* Người duyệt */}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Người duyệt</Text>
      <Text style={styles.infoValue}>{item.nguoiDuyet}</Text>
    </View>

    <View style={styles.separator} />

    {/* Thành tiền */}
    <View style={styles.tienRow}>
      <Text style={styles.tienLabel}>Thành tiền</Text>
      <Text style={styles.tienValue}>{formatTien(item.soTien)}</Text>
    </View>
  </View>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>🍽️</Text>
    <Text style={styles.emptyTitle}>Chưa có món nào được lên</Text>
    <Text style={styles.emptySub}>Các phiếu đã duyệt sẽ hiện ở đây</Text>
  </View>
);

// ─── Summary header ───────────────────────────────────────────────────────────

const SummaryHeader: React.FC<{ data: PhieuDaLenMon[] }> = ({ data }) => {
  const tongTien = data.reduce((acc, i) => acc + i.soTien, 0);
  const tongMon = data.reduce((acc, i) => acc + i.soLuong, 0);

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

const ListOfDishesAlreadyServed: React.FC = () => (
  <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
    <FlatList
      data={danhSachDaLenMon}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        <>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Danh sách đã lên món</Text>
            <Text style={styles.sectionSub}>
              {danhSachDaLenMon.length} phiếu · hôm nay
            </Text>
          </View>
          {danhSachDaLenMon.length > 0 && (
            <SummaryHeader data={danhSachDaLenMon} />
          )}
        </>
      }
      renderItem={({ item, index }) => <PhieuItem item={item} index={index} />}
      ListEmptyComponent={<EmptyState />}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  </SafeAreaView>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const TEAL = "#2BBFB3";
const TEAL_BG = "#EAF8F7";
const GREEN = "#4CAF50";
const GREEN_BG = "#EDF7EE";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },

  // Header
  listHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEAL,
    letterSpacing: 0.1,
  },
  sectionSub: {
    fontSize: 15,
    color: "#999",
    marginTop: 2,
  },

  // Summary strip
  summary: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNum: {
    fontSize: 15,
    fontWeight: "700",
    color: TEAL,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#999",
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5e5",
    marginVertical: 4,
  },

  // Card
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

  // Card top row
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
  sttText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: GREEN,
  },

  // Mã + ngày
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  maSo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  ngay: {
    fontSize: 15,
    color: "#999",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EFEFEF",
    marginVertical: 8,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: "#888",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
    textAlign: "right",
    flex: 2,
  },

  // SL badge
  soLuongBadge: {
    backgroundColor: TEAL_BG,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  soLuongText: {
    fontSize: 15,
    fontWeight: "700",
    color: TEAL,
  },

  // Thành tiền
  tienRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  tienLabel: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
  },
  tienValue: {
    fontSize: 16,
    fontWeight: "700",
    color: TEAL,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: "#999" },
});

export default ListOfDishesAlreadyServed;
