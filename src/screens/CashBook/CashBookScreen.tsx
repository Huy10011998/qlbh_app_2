import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";

// ===== TYPES =====
type Transaction = {
  id: string;
  type: "thu" | "chi";
  category: string;
  name: string;
  date: string;
  dateObj: Date;
  amount: number;
};

type QuickFilter = "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";
type TypeFilter = "all" | "thu" | "chi";

// ===== MOCK DATA =====
const today = new Date();
const fmt = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() - n);
  return d;
};

const MOCK_DATA: Transaction[] = [
  {
    id: "1",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Mỹ modern (Ly) x1",
    date: fmt(today),
    dateObj: today,
    amount: 15000,
  },
  {
    id: "2",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Sinh tố dâu (Ly) x1",
    date: fmt(today),
    dateObj: today,
    amount: 28000,
  },
  {
    id: "3",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Sting (Chai 330ml) x1",
    date: fmt(today),
    dateObj: today,
    amount: 15000,
  },
  {
    id: "4",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Cà phê sữa (Ly) x4",
    date: fmt(today),
    dateObj: today,
    amount: 88000,
  },
  {
    id: "5",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Ép cam (Ly) x1",
    date: fmt(today),
    dateObj: today,
    amount: 25000,
  },
  {
    id: "6",
    type: "chi",
    category: "Chi phí vận hành",
    name: "Tiền điện tháng 3",
    date: fmt(today),
    dateObj: today,
    amount: -2500000,
  },
  {
    id: "7",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Bạc xỉu (Ly) x1",
    date: fmt(daysAgo(1)),
    dateObj: daysAgo(1),
    amount: 22000,
  },
  {
    id: "8",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Cà phê đen (Ly) x7",
    date: fmt(daysAgo(1)),
    dateObj: daysAgo(1),
    amount: 126000,
  },
  {
    id: "9",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Ép ổi (Ly) x3",
    date: fmt(daysAgo(1)),
    dateObj: daysAgo(1),
    amount: 75000,
  },
  {
    id: "10",
    type: "chi",
    category: "Chi phí nhân sự",
    name: "Lương nhân viên tháng 3",
    date: fmt(daysAgo(1)),
    dateObj: daysAgo(1),
    amount: -12210279,
  },
  {
    id: "11",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Juicy milk dâu x2",
    date: fmt(daysAgo(2)),
    dateObj: daysAgo(2),
    amount: 30000,
  },
  {
    id: "12",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Kem merino bánh bắp x3",
    date: fmt(daysAgo(2)),
    dateObj: daysAgo(2),
    amount: 45000,
  },
  {
    id: "13",
    type: "chi",
    category: "Chi phí vận hành",
    name: "Nhập nguyên liệu cà phê",
    date: fmt(daysAgo(2)),
    dateObj: daysAgo(2),
    amount: -8200000,
  },
  {
    id: "14",
    type: "thu",
    category: "Doanh Thu Cà phê",
    name: "Trà đào cam sả (Ly) x2",
    date: fmt(daysAgo(5)),
    dateObj: daysAgo(5),
    amount: 60000,
  },
  {
    id: "15",
    type: "chi",
    category: "Chi phí vận hành",
    name: "Tiền nước tháng 3",
    date: fmt(daysAgo(5)),
    dateObj: daysAgo(5),
    amount: -350000,
  },
];

// ===== HELPERS =====
const formatMoney = (n: number) => Math.abs(n).toLocaleString("vi-VN");

const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const endOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
};

const getDateRange = (q: QuickFilter, from: Date, to: Date): [Date, Date] => {
  const t = new Date();
  switch (q) {
    case "today":
      return [startOfDay(t), t];
    case "yesterday": {
      const y = daysAgo(1);
      return [startOfDay(y), endOfDay(y)]; // fix luôn chỗ này
    }
    case "thisWeek": {
      const w = new Date(t);
      w.setDate(t.getDate() - t.getDay() + 1);
      return [startOfDay(w), t];
    }
    case "thisMonth":
      return [startOfDay(new Date(t.getFullYear(), t.getMonth(), 1)), t];
    default:
      return [startOfDay(from), endOfDay(to)]; // ✅ fix ở đây
  }
};

// ===== GROUP BY DATE =====
type ListItem =
  | { kind: "header"; date: string; thu: number; chi: number }
  | { kind: "row"; data: Transaction };

const buildList = (data: Transaction[]): ListItem[] => {
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
    result.push({ kind: "header", date, thu, chi });
    rows.forEach((r) => result.push({ kind: "row", data: r }));
  });
  return result;
};

// ===== SUB COMPONENTS =====
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
  onPress: (v: TypeFilter) => void;
}> = ({ label, value, current, color, onPress }) => {
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
      <Text
        style={[styles.typeTabText, active && { color, fontWeight: "600" }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const DateGroupHeader: React.FC<{ date: string; thu: number; chi: number }> = ({
  date,
  thu,
  chi,
}) => (
  <View style={styles.groupHeader}>
    <Text style={styles.groupDate}>{date}</Text>
    <View style={styles.groupSummary}>
      {thu > 0 && <Text style={styles.groupThu}>+{formatMoney(thu)}</Text>}
      {chi > 0 && <Text style={styles.groupChi}>-{formatMoney(chi)}</Text>}
    </View>
  </View>
);

const TransactionRow: React.FC<{ item: Transaction }> = ({ item }) => (
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
);

const EmptyState: React.FC = () => (
  <View style={styles.emptyWrap}>
    <Ionicons name="document-outline" size={52} color="#CCC" />
    <Text style={styles.emptyTitle}>Không có giao dịch</Text>
    <Text style={styles.emptyDesc}>
      Không tìm thấy dữ liệu trong khoảng thời gian đã chọn
    </Text>
  </View>
);

// ===== MAIN SCREEN =====
const CashBookScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [fromDate, setFromDate] = useState(daysAgo(1));
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [from, to] = getDateRange(quickFilter, fromDate, toDate);

  const filtered = MOCK_DATA.filter((t) => {
    const inRange = t.dateObj >= startOfDay(from) && t.dateObj <= to;
    const inType = typeFilter === "all" || t.type === typeFilter;
    return inRange && inType;
  });

  const tongThu = filtered
    .filter((t) => t.type === "thu")
    .reduce((s, t) => s + t.amount, 0);
  const tongChi = filtered
    .filter((t) => t.type === "chi")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = tongThu - tongChi;
  const isPos = net >= 0;

  const listData = buildList(filtered);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: gọi API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickChips: { label: string; value: QuickFilter }[] = [
    { label: "Hôm nay", value: "today" },
    { label: "Hôm qua", value: "yesterday" },
    { label: "Tuần này", value: "thisWeek" },
    { label: "Tháng này", value: "thisMonth" },
    { label: "Tuỳ chọn", value: "custom" },
  ];

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 13 }]}>
        <Text style={styles.headerTitle}>Sổ quỹ</Text>
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

      {/* QUICK FILTER CHIPS */}
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
            <Text style={[styles.sumVal, styles.colorThu]}>
              +{formatMoney(tongThu)}
            </Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumCard}>
            <Text style={styles.sumLabel}>Tổng chi</Text>
            <Text style={[styles.sumVal, styles.colorChi]}>
              -{formatMoney(tongChi)}
            </Text>
          </View>
        </View>
        <View style={styles.netRow}>
          <Text style={styles.netLabel}>Thu – Chi</Text>
          <Text
            style={[styles.netVal, isPos ? styles.colorThu : styles.colorChi]}
          >
            {isPos ? "+" : "-"}
            {formatMoney(net)}
          </Text>
        </View>
      </View>

      {/* TYPE FILTER TABS */}
      <View style={styles.typeTabs}>
        <TypeTab
          label="Tất cả"
          value="all"
          current={typeFilter}
          color="#0F4D3A"
          onPress={setTypeFilter}
        />
        <TypeTab
          label="Thu"
          value="thu"
          current={typeFilter}
          color="#0F6E56"
          onPress={setTypeFilter}
        />
        <TypeTab
          label="Chi"
          value="chi"
          current={typeFilter}
          color="#A32D2D"
          onPress={setTypeFilter}
        />
      </View>

      {/* LIST */}
      <FlatList
        data={listData}
        keyExtractor={(item, idx) =>
          item.kind === "header" ? `h-${item.date}` : `r-${item.data.id}-${idx}`
        }
        renderItem={({ item }) =>
          item.kind === "header" ? (
            <DateGroupHeader date={item.date} thu={item.thu} chi={item.chi} />
          ) : (
            <TransactionRow item={item.data} />
          )
        }
        ListEmptyComponent={<EmptyState />}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F4D3A"
          />
        }
      />

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Text style={styles.footerLabel}>Tổng cộng (Thu - Chi)</Text>
        <Text
          style={[
            styles.footerVal,
            isPos ? styles.colorThuLight : styles.colorChiLight,
          ]}
        >
          {isPos ? "+" : "-"}
          {formatMoney(net)}
        </Text>
      </View>
    </View>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 16,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "600", flex: 1 },
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#C8C8C8",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "500" },

  filterBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateBtnText: { fontSize: 13, color: "#333" },
  dateSep: { fontSize: 13, color: "#999" },

  summaryWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  sumCard: { flex: 1, paddingVertical: 12, alignItems: "center" },
  sumLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  sumVal: { fontSize: 14, fontWeight: "600" },
  sumDivider: { width: 0.5, height: 40, backgroundColor: "#E0E0E0" },
  netRow: {
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  netLabel: { fontSize: 13, color: "#555" },
  netVal: { fontSize: 15, fontWeight: "700" },

  typeTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  typeTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  typeTabText: { fontSize: 13, color: "#888" },

  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  groupDate: { fontSize: 12, fontWeight: "600", color: "#555" },
  groupSummary: { flexDirection: "row", gap: 10 },
  groupThu: { fontSize: 12, color: "#0F6E56", fontWeight: "500" },
  groupChi: { fontSize: 12, color: "#A32D2D", fontWeight: "500" },

  list: { flex: 1 },

  row: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotThu: { backgroundColor: "#1D9E75" },
  dotChi: { backgroundColor: "#E24B4A" },
  rowBody: { flex: 1, minWidth: 0 },
  rowCategory: { fontSize: 11, color: "#999", marginBottom: 2 },
  rowName: { fontSize: 13, color: "#1A1A1A" },
  rowAmount: { fontSize: 13, fontWeight: "600", flexShrink: 0 },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "500", color: "#888" },
  emptyDesc: {
    fontSize: 13,
    color: "#AAA",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  footer: {
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  footerLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  footerVal: { fontSize: 16, fontWeight: "700" },

  colorThu: { color: "#0F6E56" },
  colorChi: { color: "#A32D2D" },
  colorThuLight: { color: "#5DCAA5" },
  colorChiLight: { color: "#F09595" },
});

export default CashBookScreen;
