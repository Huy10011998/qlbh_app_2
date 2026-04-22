import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface ChungTu {
  id: string;
  maSo: string;
  ngay: string;
  nguoiLap: string;
  tenSanPham: string;
  soLuong: number;
  donVi: string;
  trangThai: "tiep_nhan" | "lap_phieu" | "da_duyet" | "da_huy";
}

const danhSachDonHang: ChungTu[] = [
  {
    id: "1",
    maSo: "DCP-1962",
    ngay: "20/04/2026 11:30",
    nguoiLap: "Bàn 1",
    tenSanPham: "Ép ổi",
    soLuong: 2,
    donVi: "Ly",
    trangThai: "tiep_nhan",
  },
  {
    id: "2",
    maSo: "DCP-1963",
    ngay: "20/04/2026 11:32",
    nguoiLap: "Sân 2",
    tenSanPham: "Nước suối",
    soLuong: 5,
    donVi: "Chai",
    trangThai: "tiep_nhan",
  },
  {
    id: "3",
    maSo: "DCP-1964",
    ngay: "20/04/2026 11:35",
    nguoiLap: "Sân 1",
    tenSanPham: "Coca-cola",
    soLuong: 3,
    donVi: "Lon",
    trangThai: "tiep_nhan",
  },
  {
    id: "4",
    maSo: "DCP-1965",
    ngay: "20/04/2026 11:40",
    nguoiLap: "Bàn 2",
    tenSanPham: "Pepsi",
    soLuong: 4,
    donVi: "Lon",
    trangThai: "tiep_nhan",
  },
  {
    id: "5",
    maSo: "DCP-1966",
    ngay: "20/04/2026 11:45",
    nguoiLap: "Sân 3",
    tenSanPham: "7-Up",
    soLuong: 2,
    donVi: "Lon",
    trangThai: "tiep_nhan",
  },
  {
    id: "6",
    maSo: "DCP-1967",
    ngay: "20/04/2026 11:50",
    nguoiLap: "Sân 4",
    tenSanPham: "Bò húc",
    soLuong: 6,
    donVi: "Lon",
    trangThai: "tiep_nhan",
  },
];

// ─── Item ─────────────────────────────────────────────────────────────────────

interface ChungTuItemProps {
  item: ChungTu;
  checked: boolean;
  onToggle: (id: string) => void;
}

const ChungTuItem: React.FC<ChungTuItemProps> = ({
  item,
  checked,
  onToggle,
}) => (
  <View style={[styles.itemContainer, checked && styles.itemContainerChecked]}>
    <View style={styles.itemRow}>
      {/* Checkbox — hit area 44×44 */}
      <TouchableOpacity
        style={styles.checkboxHit}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmarkText}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.maSo}>{item.maSo}</Text>
          <Text style={styles.ngay}>{item.ngay}</Text>
        </View>

        <Text style={styles.nguoiLap}>{item.nguoiLap}</Text>

        <View style={styles.sanPhamRow}>
          <Text style={styles.tenSanPham} numberOfLines={1}>
            {item.tenSanPham}
          </Text>
          <View style={styles.soLuongBadge}>
            <Text style={styles.soLuongLabel}>SL: </Text>
            <Text style={styles.soLuongValue}>
              {item.soLuong} {item.donVi}
            </Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.lapPhieu}>Tiếp Nhận</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.divider} />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const OrderBrowsingScreen: React.FC = () => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const hasChecked = checkedIds.size > 0;

  const handleToggle = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleTiepNhan = () =>
    console.log("Tiếp nhận:", Array.from(checkedIds));
  const handleHuy = () => console.log("Huỷ:", Array.from(checkedIds));
  const handleTatCa = () => console.log("Tiếp nhận tất cả");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={danhSachDonHang}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đơn đặt hàng cần duyệt</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChungTuItem
              item={item}
              checked={checkedIds.has(item.id)}
              onToggle={handleToggle}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom — chỉ hiện khi có ít nhất 1 item được chọn */}
        {hasChecked && (
          <View style={styles.bottomContainer}>
            {/* Số đơn đã chọn */}
            <View style={styles.selectedBar}>
              <Text style={styles.selectedBarText}>
                Đã chọn{" "}
                <Text style={styles.selectedBarNum}>{checkedIds.size}</Text> đơn
              </Text>
              <TouchableOpacity
                onPress={() => setCheckedIds(new Set())}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>✕ Bỏ chọn</Text>
              </TouchableOpacity>
            </View>

            {/* Tiếp nhận + Huỷ bỏ */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.btnTiepNhan}
                onPress={handleTiepNhan}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTiepNhanText}>Duyệt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnHuy}
                onPress={handleHuy}
                activeOpacity={0.8}
              >
                <Text style={styles.btnHuyText}>Huỷ bỏ</Text>
              </TouchableOpacity>
            </View>

            {/* Tiếp nhận tất cả */}
            <TouchableOpacity
              style={styles.btnTatCa}
              onPress={handleTatCa}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTatCaText}>Duyệt tất cả</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const TEAL = "#2BBFB3";
const GREEN = "#4CAF50";
const AMBER = "#F5A623";
const SLATE = "#B0C4D8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  listContent: { paddingBottom: 8 },

  // Section header
  sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: TEAL },

  // Item
  itemContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  itemContainerChecked: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 8,
    marginHorizontal: 8,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  itemRow: { flexDirection: "row", alignItems: "flex-start" },

  // Checkbox hit area 44×44
  checkboxHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
    marginLeft: -12,
    marginTop: -4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: TEAL },
  checkmarkText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 16,
  },

  // Item content
  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  maSo: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  ngay: { fontSize: 15, color: "#555", fontStyle: "italic" },
  nguoiLap: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
    fontStyle: "italic",
  },

  sanPhamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tenSanPham: {
    fontSize: 15,
    color: "#333",
    fontStyle: "italic",
    flex: 1,
    marginRight: 8,
  },
  soLuongBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF8F7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soLuongLabel: { fontSize: 15, color: "#666" },
  soLuongValue: { fontSize: 15, fontWeight: "700", color: TEAL },

  lapPhieu: {
    fontSize: 15,
    color: "#e05c3a",
    fontWeight: "500",
    marginBottom: 4,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
  },

  // ── Bottom — chỉ render khi hasChecked ────────────────────────────────────
  bottomContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },

  // Selected bar
  selectedBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EAF8F7",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedBarText: { fontSize: 15, color: "#444" },
  selectedBarNum: { fontWeight: "700", color: TEAL },
  clearText: { fontSize: 15, color: "#e05c3a", fontWeight: "500" },

  // Buttons
  actionRow: { flexDirection: "row", gap: 12 },

  btnTiepNhan: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnTiepNhanText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  btnHuy: {
    flex: 1,
    backgroundColor: AMBER,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnHuyText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  btnTatCa: {
    backgroundColor: SLATE,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnTatCaText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

export default OrderBrowsingScreen;
