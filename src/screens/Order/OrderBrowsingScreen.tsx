import React, { useState, useCallback, useEffect } from "react";
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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  danhSachDatHangCaPhe,
  danhSachDatHangCaPheChiTiet,
  updateTrangThaiPhucVu,
} from "../../services/data/CallApi";
import {
  DatHangApiItem,
  ChungTu,
  ChiTietApiItem,
  ChiTietItem,
} from "../../types/Api.d";
import { ChungTuItemProps } from "../../types";
import { formatTien, mapApiItem } from "../../utils/Helper";
import { emitAppRefetch, subscribeAppRefetch } from "../../utils/AppRefetchBus";

// ─── Item Component ───────────────────────────────────────────────────────────

const ChungTuItem: React.FC<ChungTuItemProps> = ({
  item,
  checked,
  onToggle,
}) => (
  <View style={[styles.itemContainer, checked && styles.itemContainerChecked]}>
    <View style={styles.itemRow}>
      <TouchableOpacity
        style={styles.checkboxHit}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmarkText}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.itemContent}>
        {/* Row 1: mã + thời gian */}
        <View style={styles.itemHeader}>
          <Text style={styles.maSo}>{item.maDatHang}</Text>
          <Text style={styles.ngay}>
            {item.ngay} {item.thoiGian}
          </Text>
        </View>

        {/* Row 2: vị trí */}
        <Text style={styles.nguoiLap}>{item.viTri}</Text>

        {/* Row 3: chi tiết hàng hoá */}
        {item.chiTiet.length > 0 && (
          <View style={styles.chiTietContainer}>
            {item.chiTiet.map((ct, idx) => (
              <View key={idx} style={styles.chiTietRow}>
                <Text style={styles.chiTietTen} numberOfLines={1}>
                  • {ct.tenHang}
                </Text>
                <View style={styles.chiTietSLBadge}>
                  <Text style={styles.chiTietSL}>x{ct.soLuong}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Row 4: trạng thái + tổng tiền */}
        <View style={styles.sanPhamRow}>
          <View style={styles.trangThaiBadge}>
            <Text style={styles.trangThaiText}>{item.trangThai}</Text>
          </View>
          <View style={styles.soLuongBadge}>
            <Text style={styles.soLuongLabel}>Tổng: </Text>
            <Text style={styles.soLuongValue}>{formatTien(item.tongTien)}</Text>
          </View>
        </View>
      </View>
    </View>
    <View style={styles.divider} />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const OrderBrowsingScreen: React.FC = () => {
  const [danhSach, setDanhSach] = useState<ChungTu[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const hasChecked = checkedIds.size > 0;

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchDanhSach = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await danhSachDatHangCaPhe<any>(1);
      const rawItems: DatHangApiItem[] = res?.data?.items ?? [];
      const mapped = rawItems.map(mapApiItem);
      setDanhSach(mapped);

      const ids = rawItems
        .map((i) => i.id)
        .filter((id): id is number => typeof id === "number");

      if (ids.length === 0) return;

      const resChiTiet = await danhSachDatHangCaPheChiTiet<any>(ids);
      const chiTietRaw: ChiTietApiItem[] = resChiTiet?.data?.items ?? [];

      const chiTietMap = new Map<number, ChiTietItem[]>();
      for (const ct of chiTietRaw) {
        const key = ct.iD_DatHang_BanCaPhe ?? 0;
        if (!chiTietMap.has(key)) chiTietMap.set(key, []);
        chiTietMap.get(key)!.push({
          tenHang: ct.iD_SanPham_MoTa ?? "",
          soLuong: ct.soLuong ?? 0,
        });
      }

      setDanhSach(
        mapped.map((item) => ({
          ...item,
          chiTiet: chiTietMap.get(item.rawId) ?? [],
        })),
      );
    } catch {
      setError("Không tải được danh sách. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDanhSach();
  }, [fetchDanhSach]);

  // Thêm useEffect này sau useEffect([fetchDanhSach])
  useEffect(() => {
    const unsub = subscribeAppRefetch((source) => {
      if (
        source === "notification" ||
        source === "foreground" ||
        source === "network"
      ) {
        fetchDanhSach(true);
      }
    });
    return unsub;
  }, [fetchDanhSach]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getCheckedRawIds = (): number[] =>
    danhSach
      .filter((item) => checkedIds.has(item.id))
      .map((item) => item.rawId);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleTiepNhan = () => {
    const ids = getCheckedRawIds();
    if (ids.length === 0) return;
    Alert.alert(
      "Xác nhận duyệt",
      `Bạn có chắc muốn duyệt ${ids.length} đơn hàng đã chọn?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Duyệt",
          style: "default",
          onPress: async () => {
            try {
              await updateTrangThaiPhucVu(ids, 2);
              setCheckedIds(new Set());
              await fetchDanhSach(true);
              emitAppRefetch("notification");
              Alert.alert("Thành công", `Đã duyệt ${ids.length} đơn hàng.`);
            } catch {
              Alert.alert("Lỗi", "Không thể duyệt đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  const handleHuy = () => {
    const ids = getCheckedRawIds();
    if (ids.length === 0) return;
    Alert.alert(
      "Xác nhận huỷ",
      `Bạn có chắc muốn huỷ ${ids.length} đơn hàng đã chọn?`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Huỷ đơn",
          style: "destructive",
          onPress: async () => {
            try {
              await updateTrangThaiPhucVu(ids, 14);
              setCheckedIds(new Set());
              await fetchDanhSach(true);
              emitAppRefetch("notification");
              Alert.alert("Thành công", `Đã huỷ ${ids.length} đơn hàng.`);
            } catch {
              Alert.alert("Lỗi", "Không thể huỷ đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  const handleTatCa = () => {
    const ids = danhSach.map((item) => item.rawId);
    if (ids.length === 0) return;
    Alert.alert(
      "Xác nhận duyệt tất cả",
      `Bạn có chắc muốn duyệt toàn bộ ${ids.length} đơn hàng?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Duyệt tất cả",
          style: "default",
          onPress: async () => {
            try {
              await updateTrangThaiPhucVu(ids, 2);
              setCheckedIds(new Set());
              await fetchDanhSach(true);
              emitAppRefetch("notification");
              Alert.alert(
                "Thành công",
                `Đã duyệt toàn bộ ${ids.length} đơn hàng.`,
              );
            } catch {
              Alert.alert("Lỗi", "Không thể duyệt đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchDanhSach()}
            >
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={danhSach}
            keyExtractor={(i) => i.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchDanhSach(true)}
                colors={[TEAL]}
                tintColor={TEAL}
              />
            }
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đơn đặt hàng cần duyệt</Text>
                {danhSach.length > 0 && (
                  <Text style={styles.sectionCount}>{danhSach.length} đơn</Text>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyIcon}>🧾</Text>
                <Text style={styles.emptyText}>
                  Không có đơn hàng nào cần duyệt.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ChungTuItem
                item={item}
                checked={checkedIds.has(item.id)}
                onToggle={handleToggle}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              danhSach.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {hasChecked && (
          <View style={styles.bottomContainer}>
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
const AMBER = "#1565c0";
const SLATE = "#B0C4D8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  listContent: { paddingBottom: 8 },
  listContentEmpty: { flex: 1 },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: { fontSize: 15, color: "#666", marginTop: 8 },
  errorText: { fontSize: 15, color: "#e05c3a", textAlign: "center" },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: 15, color: TEAL, fontWeight: "500" },
  retryBtn: {
    backgroundColor: TEAL,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: TEAL },
  sectionCount: {
    fontSize: 15,
    color: "#fff",
    backgroundColor: TEAL,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },

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

  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  maSo: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  ngay: { fontSize: 15, color: "#555", fontStyle: "italic" },
  nguoiLap: { fontSize: 15, color: "#333", marginBottom: 6, fontWeight: "500" },

  chiTietContainer: {
    backgroundColor: "#F8FFFE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D6F5F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 4,
  },
  chiTietRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chiTietTen: { fontSize: 15, color: "#333", flex: 1, marginRight: 8 },
  chiTietSLBadge: {
    backgroundColor: "#EAF8F7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chiTietSL: { fontSize: 15, fontWeight: "700", color: TEAL },

  sanPhamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  trangThaiBadge: {
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  trangThaiText: { fontSize: 15, color: AMBER, fontWeight: "600" },
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

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
  },

  bottomContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
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
