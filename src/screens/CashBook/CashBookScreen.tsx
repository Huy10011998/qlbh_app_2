import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  StyleProp,
  Text,
  ViewStyle,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";
import { soquy } from "../../services/data/CallApi";
import {
  ApiItem,
  ApiResponse,
  QuickFilter,
  Transaction,
  TypeFilter,
} from "../../types/Api.d";
import {
  daysAgo,
  fmt,
  formatMoney,
  getDateRange,
  getHeaderSubtitle,
  toLocalISOString,
} from "../../utils/Helper";
import { ListItem, ViewMode } from "../../types";
import { useAppRefetch } from "../../hooks/useAppRefetch";
import { log, warn } from "../../utils/Logger";
import { colors } from "../../constants/theme";

// ====================== API ======================
const fetchSoQuy = async (from: Date, to: Date): Promise<Transaction[]> => {
  try {
    // Đảm bảo from = đầu ngày, to = cuối ngày — bất kể giờ được truyền vào
    const fromStart = new Date(from);
    fromStart.setHours(0, 0, 0, 0);

    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);

    const json = await soquy<ApiResponse>(
      toLocalISOString(fromStart), // "2026-04-17T00:00:00.000"
      toLocalISOString(toEnd), // "2026-04-17T23:59:59.999"
    );
    const raw: ApiItem[] = json.data ?? [];

    log("[CashBook] fetchSoQuy:api-response", {
      from: toLocalISOString(fromStart),
      to: toLocalISOString(toEnd),
      rawCount: raw.length,
      sample: raw.slice(0, 5).map((item, idx) => ({
        idx,
        text: item.text,
        loai: item.loai,
        loaiThuChi: item.loaiThuChi,
        ngay: item.ngay,
        tongTien: item.tongTien,
      })),
    });

    const mapped = raw.map((item, idx) => {
      const isThu = item.loaiThuChi?.toLowerCase().trim() === "thu";
      const type: "thu" | "chi" = isThu ? "thu" : "chi";

      return {
        id: String(idx),
        type,
        category: item.text?.trim() || "Khác",
        name: item.loai || "",
        date: fmt(item.ngay ? new Date(item.ngay) : fromStart),
        dateObj: item.ngay ? new Date(item.ngay) : fromStart,
        amount: item.tongTien || 0,
      };
    });

    log("[CashBook] fetchSoQuy:mapped-transactions", {
      count: mapped.length,
      sample: mapped.slice(0, 5).map((item) => ({
        id: item.id,
        type: item.type,
        category: item.category,
        name: item.name,
        date: item.date,
        amount: item.amount,
      })),
    });

    return mapped;
  } catch (error) {
    warn("fetchSoQuy error:", error);
    return [];
  }
};

// ====================== BUILD LIST ======================
const buildListByDate = (data: Transaction[]): ListItem[] => {
  if (data.length === 0) return [];

  const groups: Record<string, Transaction[]> = {};
  data.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  const result: ListItem[] = [];
  Object.entries(groups).forEach(([date, rows]) => {
    const thu = rows
      .filter((r) => r.type === "thu")
      .reduce((s, r) => s + r.amount, 0);
    const chi = rows
      .filter((r) => r.type === "chi")
      .reduce((s, r) => s + Math.abs(r.amount), 0);
    result.push({ kind: "dateHeader", date, thu, chi });
    rows.forEach((r) => result.push({ kind: "row", data: r }));
  });
  return result;
};

const buildListByCategory = (data: Transaction[]): ListItem[] => {
  if (data.length === 0) return [];

  const groups: Record<string, Transaction[]> = {};
  data.forEach((t) => {
    const key = t.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const result: ListItem[] = [];
  Object.entries(groups).forEach(([category, rows]) => {
    const thu = rows
      .filter((r) => r.type === "thu")
      .reduce((s, r) => s + r.amount, 0);
    const chi = rows
      .filter((r) => r.type === "chi")
      .reduce((s, r) => s + Math.abs(r.amount), 0);
    const total = thu - chi;

    result.push({
      kind: "categoryHeader",
      category,
      count: rows.length,
      amount: Math.abs(total),
      type: total >= 0 ? "thu" : "chi",
      children: rows,
    } as ListItem);
  });
  return result;
};

// ====================== COMPONENTS ======================
const SkeletonBox: React.FC<{
  width: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width, height, style }) => {
  const anim = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 6, backgroundColor: "#E5E7EB" },
        style,
      ]}
    />
  );
};

const CategoryHeader = React.memo<{
  item: Extract<ListItem, { kind: "categoryHeader" }>;
  isExpanded: boolean;
  onToggle: () => void;
}>(({ item, isExpanded, onToggle }) => (
  <TouchableOpacity
    style={styles.categoryHeader}
    onPress={onToggle}
    activeOpacity={0.8}
  >
    <View style={styles.categoryHeaderLeft}>
      <Ionicons
        name={isExpanded ? "chevron-down" : "chevron-forward"}
        size={20}
        color="#555"
      />
      <Text style={styles.categoryName}>{item.category}</Text>
    </View>
    <View style={styles.categoryHeaderRight}>
      <Text style={styles.categoryCount}>{item.count} dòng</Text>
      <Text
        style={[
          styles.categoryAmount,
          item.type === "thu" ? styles.colorThu : styles.colorChi,
        ]}
      >
        {item.type === "thu" ? "+" : "-"}
        {formatMoney(item.amount)}
      </Text>
    </View>
  </TouchableOpacity>
));

const DateGroupHeader = React.memo<{ date: string; thu: number; chi: number }>(
  ({ date, thu, chi }) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupDate}>{date}</Text>
      <View style={styles.groupSummary}>
        {thu > 0 && <Text style={styles.groupThu}>+{formatMoney(thu)}</Text>}
        {chi > 0 && <Text style={styles.groupChi}>-{formatMoney(chi)}</Text>}
      </View>
    </View>
  ),
);

const TransactionRow = React.memo<{ item: Transaction }>(({ item }) => (
  <TouchableOpacity style={styles.row} activeOpacity={0.6}>
    <View
      style={[styles.dot, item.type === "thu" ? styles.dotThu : styles.dotChi]}
    />
    <View style={styles.rowBody}>
      <Text style={styles.rowCategory}>{item.category}</Text>
      <Text style={styles.rowName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
    <Text
      style={[
        styles.rowAmount,
        item.type === "thu" ? styles.colorThu : styles.colorChi,
      ]}
    >
      {item.type === "thu" ? "+" : "-"}
      {formatMoney(item.amount)}
    </Text>
  </TouchableOpacity>
));

const EmptyState = React.memo(() => (
  <View style={styles.emptyWrap}>
    <Ionicons name="wallet-outline" size={72} color="#D1D5DB" />
    <Text style={styles.emptyTitle}>Không có giao dịch</Text>
    <Text style={styles.emptyDesc}>
      Không tìm thấy dữ liệu trong khoảng thời gian đã chọn
    </Text>
  </View>
));

const QuickChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const TypeTab: React.FC<{
  label: string;
  value: TypeFilter;
  current: TypeFilter;
  color: string;
  count: number;
  onPress: (v: TypeFilter) => void;
}> = ({ label, value, current, color, count, onPress }) => {
  const active = current === value;
  return (
    <TouchableOpacity
      style={[
        styles.typeTab,
        active && { borderBottomColor: color, borderBottomWidth: 2 },
      ]}
      onPress={() => onPress(value)}
      activeOpacity={0.7}
    >
      <View style={styles.typeTabInner}>
        <Text
          style={[styles.typeTabText, active && { color, fontWeight: "600" }]}
        >
          {label}
        </Text>
        {count > 0 && (
          <View
            style={[
              styles.tabBadge,
              { backgroundColor: active ? color : "#E5E5E5" },
            ]}
          >
            <Text
              style={[styles.tabBadgeText, { color: active ? "#fff" : "#888" }]}
            >
              {count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ====================== MAIN SCREEN ======================
const CashBookScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("date");

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const [fromDate, setFromDate] = useState(daysAgo(1));
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [from, to] = useMemo(
    () => getDateRange(quickFilter, fromDate, toDate),
    [quickFilter, fromDate, toDate],
  );

  const subtitle = useMemo(
    () => getHeaderSubtitle(quickFilter, from, to),
    [quickFilter, from, to],
  );

  const loadData = useCallback(
    async (isRefresh = false) => {
      log("[CashBook] loadData:start", {
        isRefresh,
        quickFilter,
        typeFilter,
        viewMode,
        from: toLocalISOString(from),
        to: toLocalISOString(to),
      });
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await fetchSoQuy(from, to);
        log("[CashBook] loadData:setTransactions", {
          count: data.length,
          sample: data.slice(0, 5).map((item) => ({
            id: item.id,
            type: item.type,
            category: item.category,
            name: item.name,
            amount: item.amount,
          })),
        });
        setTransactions(data);
        setExpandedCategories(new Set());
      } catch {
        setTransactions([]);
      } finally {
        log("[CashBook] loadData:finish");
        setLoading(false);
        setRefreshing(false);
      }
    },
    [from, quickFilter, to, typeFilter, viewMode],
  );

  useAppRefetch(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  const { tongThu, tongChi, net } = useMemo(() => {
    let thu = 0;
    let chi = 0;

    filtered.forEach((t) => {
      if (t.type === "thu") thu += Math.abs(t.amount);
      else chi += Math.abs(t.amount);
    });

    return { tongThu: thu, tongChi: chi, net: thu - chi };
  }, [filtered]);

  const listData = useMemo(() => {
    return viewMode === "date"
      ? buildListByDate(filtered)
      : buildListByCategory(filtered);
  }, [filtered, viewMode]);

  useEffect(() => {
    log("[CashBook] state:transactions", {
      count: transactions.length,
      sample: transactions.slice(0, 5).map((item) => ({
        id: item.id,
        type: item.type,
        category: item.category,
        name: item.name,
        amount: item.amount,
      })),
    });
  }, [transactions]);

  useEffect(() => {
    log("[CashBook] state:listData", {
      viewMode,
      typeFilter,
      filteredCount: filtered.length,
      listCount: listData.length,
      sample: listData.slice(0, 8).map((item) => {
        if (item.kind === "dateHeader") {
          return {
            kind: item.kind,
            date: item.date,
            thu: item.thu,
            chi: item.chi,
          };
        }

        if (item.kind === "categoryHeader") {
          return {
            kind: item.kind,
            category: item.category,
            count: item.count,
            amount: item.amount,
            type: item.type,
            childCount: item.children?.length ?? 0,
          };
        }

        return {
          kind: item.kind,
          id: item.data.id,
          category: item.data.category,
          name: item.data.name,
          amount: item.data.amount,
        };
      }),
    });
  }, [filtered.length, listData, typeFilter, transactions.length, viewMode]);

  const countThu = useMemo(
    () => transactions.filter((t) => t.type === "thu").length,
    [transactions],
  );
  const countChi = useMemo(
    () => transactions.filter((t) => t.type === "chi").length,
    [transactions],
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      newSet.has(category) ? newSet.delete(category) : newSet.add(category);
      return newSet;
    });
  };

  const quickChips: { label: string; value: QuickFilter }[] = [
    { label: "Hôm nay", value: "today" },
    { label: "Hôm qua", value: "yesterday" },
    { label: "Tuần này", value: "thisWeek" },
    { label: "Tháng này", value: "thisMonth" },
    { label: "Tuỳ chọn", value: "custom" },
  ];

  const isEmpty = !loading && listData.length === 0;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brandGreen} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 13 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Sổ quỹ</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons
            name="search-outline"
            size={20}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons
            name="download-outline"
            size={20}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
      </View>

      {/* QUICK FILTER */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {quickChips.map((c) => (
            <QuickChip
              key={c.value}
              label={c.label}
              active={quickFilter === c.value}
              onPress={() => setQuickFilter(c.value)}
            />
          ))}
        </ScrollView>
      </View>

      {/* CUSTOM DATE PICKER */}
      {quickFilter === "custom" && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.dateBtnText}>{fmt(fromDate)}</Text>
            <Ionicons name="calendar-outline" size={14} color="#888" />
          </TouchableOpacity>
          <Text style={styles.dateSep}>–</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.dateBtnText}>{fmt(toDate)}</Text>
            <Ionicons name="calendar-outline" size={14} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      <DatePicker
        modal
        open={showFromPicker}
        date={fromDate}
        mode="date"
        locale="vi"
        title="Từ ngày"
        confirmText="Chọn"
        cancelText="Huỷ"
        onConfirm={(d) => {
          setShowFromPicker(false);
          setFromDate(d);
        }}
        onCancel={() => setShowFromPicker(false)}
      />
      <DatePicker
        modal
        open={showToPicker}
        date={toDate}
        mode="date"
        locale="vi"
        title="Đến ngày"
        confirmText="Chọn"
        cancelText="Huỷ"
        onConfirm={(d) => {
          setShowToPicker(false);
          setToDate(d);
        }}
        onCancel={() => setShowToPicker(false)}
      />

      {/* SUMMARY */}
      <View style={styles.summaryWrap}>
        <View style={styles.summaryRow}>
          <View style={styles.sumCard}>
            <Text style={styles.sumLabel}>Tổng thu</Text>
            {loading ? (
              <SkeletonBox width={100} height={16} />
            ) : (
              <Text style={[styles.sumVal, styles.colorThu]}>
                +{formatMoney(tongThu)}
              </Text>
            )}
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumCard}>
            <Text style={styles.sumLabel}>Tổng chi</Text>
            {loading ? (
              <SkeletonBox width={100} height={16} />
            ) : (
              <Text style={[styles.sumVal, styles.colorChi]}>
                -{formatMoney(tongChi)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.netRow}>
          <Text style={styles.netLabel}>Thu – Chi</Text>
          {loading ? (
            <SkeletonBox width={130} height={18} />
          ) : (
            <Text
              style={[
                styles.netVal,
                net >= 0 ? styles.colorThu : styles.colorChi,
              ]}
            >
              {formatMoney(net)}
            </Text>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={styles.typeTabs}>
        <TypeTab
          label="Tất cả"
          value="all"
          current={typeFilter}
          color={colors.brandGreen}
          count={transactions.length}
          onPress={setTypeFilter}
        />
        <TypeTab
          label="Thu"
          value="thu"
          current={typeFilter}
          color="#0F6E56"
          count={countThu}
          onPress={setTypeFilter}
        />
        <TypeTab
          label="Chi"
          value="chi"
          current={typeFilter}
          color="#A32D2D"
          count={countChi}
          onPress={setTypeFilter}
        />

        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === "date" && styles.viewModeTabActive,
          ]}
          onPress={() => setViewMode("date")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "date" && styles.viewModeTextActive,
            ]}
          >
            Theo ngày
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === "category" && styles.viewModeTabActive,
          ]}
          onPress={() => setViewMode("category")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "category" && styles.viewModeTextActive,
            ]}
          >
            Theo loại
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {loading && !refreshing ? (
        <ScrollView style={styles.list} scrollEnabled={false}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonBox width="80%" height={18} />
            </View>
          ))}
        </ScrollView>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {listData.map((item, index) => {
            if (item.kind === "dateHeader") {
              return (
                <DateGroupHeader
                  key={`d-${item.date}-${index}`}
                  date={item.date}
                  thu={item.thu}
                  chi={item.chi}
                />
              );
            }

            if (item.kind === "categoryHeader") {
              const isExpanded = expandedCategories.has(item.category);
              return (
                <View key={`c-${item.category}-${index}`}>
                  <CategoryHeader
                    item={item}
                    isExpanded={isExpanded}
                    onToggle={() => toggleCategory(item.category)}
                  />
                  {isExpanded &&
                    item.children?.map((child: Transaction) => (
                      <TransactionRow key={`r-${child.id}`} item={child} />
                    ))}
                </View>
              );
            }

            return (
              <TransactionRow
                key={`r-${item.data.id}-${index}`}
                item={item.data}
              />
            );
          })}
        </ScrollView>
      )}

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <Text style={styles.footerLabel}>Tổng cộng (Thu - Chi)</Text>
        {loading ? (
          <SkeletonBox width={160} height={20} />
        ) : (
          <Text
            style={[
              styles.footerVal,
              net >= 0 ? styles.colorThuLight : styles.colorChiLight,
            ]}
          >
            {formatMoney(net)}
          </Text>
        )}
      </View>
    </View>
  );
};

// ====================== STYLES ======================
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },

  header: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 16,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: { flex: 1, gap: 2 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "600" },
  headerSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 15 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  chipsWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  chipsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#C8C8C8",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipText: { fontSize: 15, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "500" },

  filterBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "#C8C8C8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateBtnText: { fontSize: 15, color: "#333" },
  dateSep: { fontSize: 16, color: "#999" },

  summaryWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  sumCard: { flex: 1, paddingVertical: 14, alignItems: "center" },
  sumLabel: { fontSize: 15, color: "#888", marginBottom: 4 },
  sumVal: { fontSize: 15, fontWeight: "600" },
  sumDivider: { width: 1, height: 40, backgroundColor: "#E0E0E0" },
  netRow: {
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  netLabel: { fontSize: 15, color: "#555" },
  netVal: { fontSize: 16, fontWeight: "700" },

  typeTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  typeTabInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  typeTabText: { fontSize: 15, color: "#888" },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: { fontSize: 15, fontWeight: "600" },

  viewModeTab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  viewModeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.brandGreen,
  },
  viewModeText: { fontSize: 15, color: "#888" },
  viewModeTextActive: { color: colors.brandGreen, fontWeight: "600" },

  list: { flex: 1 },
  skeletonRow: { padding: 16 },

  categoryHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  categoryHeaderRight: { alignItems: "flex-end" },
  categoryName: { fontSize: 15.5, fontWeight: "600", color: "#1F2937" },
  categoryCount: { fontSize: 15, color: "#6B7280" },
  categoryAmount: { fontSize: 15.5, fontWeight: "700" },

  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
  },
  groupDate: { fontSize: 15, fontWeight: "600", color: "#374151" },
  groupSummary: { flexDirection: "row", gap: 12 },
  groupThu: { fontSize: 15, color: "#0F6E56", fontWeight: "600" },
  groupChi: { fontSize: 15, color: "#B91C1C", fontWeight: "600" },

  row: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    paddingLeft: 52,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  dotThu: { backgroundColor: "#10B981" },
  dotChi: { backgroundColor: "#EF4444" },
  rowBody: { flex: 1, minWidth: 0 },
  rowCategory: { fontSize: 15, color: "#6B7280", marginBottom: 2 },
  rowName: { fontSize: 15, color: "#111827" },
  rowAmount: { fontSize: 15, fontWeight: "600" },

  footer: {
    backgroundColor: "#1F2937",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerLabel: { color: "#D1D5DB", fontSize: 15 },
  footerVal: { fontSize: 17, fontWeight: "700" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },

  colorThu: { color: "#0F6E56" },
  colorChi: { color: "#A32D2D" },
  colorThuLight: { color: "#5DCAA5" },
  colorChiLight: { color: "#F09595" },
});

export default CashBookScreen;
