import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { updateTrangThaiPhucVu } from "../../services/data/CallApi";
import { ChungTu, ChiTietItem } from "../../types/Api.d";
import { formatTien, mapApiItem } from "../../utils/Helper";
import { emitAppRefetch } from "../../utils/AppRefetchBus";
import { useAppRefetch } from "../../hooks/useAppRefetch";
import ScreenStateView from "../../components/ui/ScreenStateView";
import { fetchCafeOrdersWithDetails } from "../../services/data/CafeOrderData";
import { colors } from "../../constants/theme";
import { log, warn } from "../../utils/Logger";

const OrderBrowsingScreen: React.FC = () => {
  const [danhSach, setDanhSach] = useState<ChungTu[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const hasChecked = checkedIds.size > 0;

  const fetchDanhSach = useCallback(async (isRefresh = false) => {
    log("[OrderBrowsing] fetchDanhSach:start", { isRefresh });
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { orders, details, detailsByOrderId } =
        await fetchCafeOrdersWithDetails(1);

      log("[OrderBrowsing] fetchDanhSach:api-response", {
        orderCount: orders.length,
        detailCount: details.length,
        detailGroupCount: detailsByOrderId.size,
        orderIds: orders.map((order) => order.id ?? null),
      });

      const mappedDanhSach = orders.map((order) => {
        const mappedItem = mapApiItem(order);
        const rawOrderId = order.id ?? 0;
        const chiTiet = (detailsByOrderId.get(rawOrderId) ?? []).map<ChiTietItem>(
          (detail) => ({
            tenHang: detail.iD_SanPham_MoTa ?? "",
            soLuong: detail.soLuong ?? 0,
          }),
        );

        log("[OrderBrowsing] fetchDanhSach:map-order", {
          rawOrderId,
          stableId: mappedItem.id,
          maDatHang: mappedItem.maDatHang,
          trangThai: mappedItem.trangThai,
          chiTietCount: chiTiet.length,
          viTri: mappedItem.viTri,
        });

        return {
          ...mappedItem,
          chiTiet,
        };
      });

      log("[OrderBrowsing] fetchDanhSach:mapped-result", {
        count: mappedDanhSach.length,
        ids: mappedDanhSach.map((item) => item.id),
      });

      setDanhSach(mappedDanhSach);
    } catch (fetchError) {
      warn("[OrderBrowsing] fetchDanhSach:error", fetchError);
      setError("Không tải được danh sách. Vui lòng thử lại.");
    } finally {
      log("[OrderBrowsing] fetchDanhSach:finish");
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDanhSach();
  }, [fetchDanhSach]);

  useEffect(() => {
    log("[OrderBrowsing] state:danhSach", {
      count: danhSach.length,
      items: danhSach.map((item) => ({
        id: item.id,
        rawId: item.rawId,
        maDatHang: item.maDatHang,
        chiTietCount: item.chiTiet.length,
      })),
    });
  }, [danhSach]);

  useEffect(() => {
    log("[OrderBrowsing] state:view", {
      loading,
      refreshing,
      error,
      danhSachCount: danhSach.length,
      checkedCount: checkedIds.size,
    });
  }, [checkedIds.size, danhSach.length, error, loading, refreshing]);

  useAppRefetch(
    useCallback(() => {
      fetchDanhSach(true);
    }, [fetchDanhSach]),
  );

  const getCheckedRawIds = (): number[] =>
    danhSach
      .filter((item) => checkedIds.has(item.id))
      .map((item) => item.rawId);

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
          onPress: async () => {
            try {
              await updateTrangThaiPhucVu(ids, 2);
              setCheckedIds(new Set());
              await fetchDanhSach(true);
              emitAppRefetch("notification");
              Alert.alert("Thành công", `Đã duyệt toàn bộ ${ids.length} đơn hàng.`);
            } catch {
              Alert.alert("Lỗi", "Không thể duyệt đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.flex}>
        {loading && (
          <ScreenStateView
            loading
            title="Đang tải..."
            color={TEAL}
            containerStyle={styles.centerContainer}
            titleStyle={styles.loadingText}
          />
        )}

        {!loading && error && (
          <ScreenStateView
            title={error}
            actionLabel="Thử lại"
            onActionPress={() => fetchDanhSach()}
            color={TEAL}
            containerStyle={styles.centerContainer}
            titleStyle={styles.errorText}
            actionStyle={styles.retryBtn}
            actionTextStyle={styles.retryBtnText}
          />
        )}

        {!loading && !error && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.listContent,
              danhSach.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đơn đặt hàng cần duyệt</Text>
                {danhSach.length > 0 && (
                  <Text style={styles.sectionCount}>{danhSach.length} đơn</Text>
                )}
              </View>

              {danhSach.length === 0 ? (
                <ScreenStateView
                  icon={<Text style={styles.emptyIcon}>🧾</Text>}
                  title="Không có đơn hàng nào cần duyệt."
                  containerStyle={styles.centerContainer}
                  titleStyle={styles.emptyText}
                />
              ) : (
                danhSach.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemContainer,
                      checkedIds.has(item.id) && styles.itemContainerChecked,
                    ]}
                  >
                    <View style={styles.itemRow}>
                      <TouchableOpacity
                        style={styles.checkboxHit}
                        onPress={() => handleToggle(item.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checkedIds.has(item.id) && styles.checkboxChecked,
                          ]}
                        >
                          {checkedIds.has(item.id) && (
                            <Text style={styles.checkmarkText}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={styles.itemContent}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.maSo}>{item.maDatHang}</Text>
                          <Text style={styles.ngay}>
                            {item.ngay} {item.thoiGian}
                          </Text>
                        </View>

                        <Text style={styles.nguoiLap}>{item.viTri}</Text>

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

                        <View style={styles.sanPhamRow}>
                          <View style={styles.trangThaiBadge}>
                            <Text style={styles.trangThaiText}>{item.trangThai}</Text>
                          </View>
                          <View style={styles.soLuongBadge}>
                            <Text style={styles.soLuongLabel}>Tổng: </Text>
                            <Text style={styles.soLuongValue}>
                              {formatTien(item.tongTien)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.divider} />
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {hasChecked && (
          <View style={styles.bottomContainer}>
            <View style={styles.selectedBar}>
              <Text style={styles.selectedBarText}>
                Đã chọn <Text style={styles.selectedBarNum}>{checkedIds.size}</Text> đơn
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
      </View>
    </SafeAreaView>
  );
};

const TEAL = colors.teal;
const GREEN = colors.success;
const AMBER = colors.info;
const SLATE = colors.slateAction;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.screenSoft },
  flex: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: colors.screenSoft },
  listContent: { flexGrow: 1, paddingBottom: 8 },
  listContentEmpty: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 12 },

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
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#F1FBF9",
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
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemContainerChecked: {
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingHorizontal: 12,
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
    backgroundColor: colors.white,
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
    marginHorizontal: -14,
  },

  bottomContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
