import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import DonutChart from "@/components/DonutChart";
import MiniBarChart from "@/components/MiniBarChart";

const MONTHS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

type Mode = "monthly" | "range";
type CatTab = "income" | "expense";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function startOfWeekStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
function startOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function startOfQuarterStr() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3);
  return `${d.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`;
}
function isValidDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}
function fmtDisplay(s: string) {
  if (!isValidDate(s)) return s;
  return new Date(s).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    getCategoryTotals, getCategoryTotalsByRange,
    getTransactionsByMonth, getTransactionsByDateRange,
    getMonthlyTrends, formatAmount,
  } = useFinance();

  const now = new Date();

  // ── Monthly mode state ──────────────────────────────────────
  const [mode,  setMode]  = useState<Mode>("monthly");
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [catTab, setCatTab] = useState<CatTab>("income");

  // ── Range mode state ────────────────────────────────────────
  const [fromDate, setFromDate] = useState(startOfMonthStr());
  const [toDate,   setToDate]   = useState(todayStr());
  const [fromRaw,  setFromRaw]  = useState(startOfMonthStr());
  const [toRaw,    setToRaw]    = useState(todayStr());
  const [catTabR,  setCatTabR]  = useState<CatTab>("income");

  const trends = getMonthlyTrends();

  // ── Monthly calculations ────────────────────────────────────
  const monthTxs      = getTransactionsByMonth(year, month);
  const monthIncome   = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense  = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthNet      = monthIncome - monthExpense;
  const monthCatTotals = getCategoryTotals(catTab, year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // ── Range calculations ──────────────────────────────────────
  const rangeValid = isValidDate(fromDate) && isValidDate(toDate) && fromDate <= toDate;

  const rangeTxs = useMemo(() => {
    if (!rangeValid) return [];
    return getTransactionsByDateRange(fromDate, toDate);
  }, [fromDate, toDate, rangeValid]);

  const rangeIncome  = rangeTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const rangeExpense = rangeTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const rangeNet     = rangeIncome - rangeExpense;
  const isProfit     = rangeNet >= 0;

  const rangeCatTotals = useMemo(() => {
    if (!rangeValid) return [];
    return getCategoryTotalsByRange(catTabR, fromDate, toDate);
  }, [catTabR, fromDate, toDate, rangeValid]);

  function applyQuick(from: string, to: string) {
    setFromDate(from); setFromRaw(from);
    setToDate(to);     setToRaw(to);
  }

  function handleFromChange(v: string) {
    setFromRaw(v);
    if (isValidDate(v)) setFromDate(v);
  }
  function handleToChange(v: string) {
    setToRaw(v);
    if (isValidDate(v)) setToDate(v);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Izvještaji</Text>

        {/* ── Mode Toggle ── */}
        <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[styles.modeBtn, mode === "monthly" && { backgroundColor: colors.primary }]}
            onPress={() => setMode("monthly")}
          >
            <Feather name="calendar" size={14} color={mode === "monthly" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === "monthly" ? "#fff" : colors.mutedForeground }]}>
              Mesečno
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "range" && { backgroundColor: colors.primary }]}
            onPress={() => setMode("range")}
          >
            <Feather name="sliders" size={14} color={mode === "range" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === "range" ? "#fff" : colors.mutedForeground }]}>
              Po periodu
            </Text>
          </Pressable>
        </View>

        {/* ════════════ MONTHLY MODE ════════════ */}
        {mode === "monthly" && (
          <>
            <View style={[styles.monthNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={prevMonth} style={styles.navArrow} testID="prev-month">
                <Feather name="chevron-left" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navArrow} testID="next-month">
                <Feather name="chevron-right" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }]}>
                <Feather name="trending-up" size={15} color={colors.income} />
                <Text style={[styles.summaryLabel, { color: colors.income }]}>Prihodi</Text>
                <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatAmount(monthIncome)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
                <Feather name="trending-down" size={15} color={colors.expense} />
                <Text style={[styles.summaryLabel, { color: colors.expense }]}>Rashodi</Text>
                <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatAmount(monthExpense)}</Text>
              </View>
            </View>

            <View style={[styles.netCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.netLeft}>
                <Feather
                  name={monthNet >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
                  size={20}
                  color={monthNet >= 0 ? colors.income : colors.expense}
                />
                <Text style={[styles.netLabel, { color: colors.mutedForeground }]}>
                  {monthNet >= 0 ? "Profit" : "Gubitak"}
                </Text>
              </View>
              <Text style={[styles.netAmount, { color: monthNet >= 0 ? colors.income : colors.expense }]}>
                {monthNet >= 0 ? "+" : ""}{formatAmount(monthNet)}
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trendovi — zadnjih 6 mj.</Text>
              <MiniBarChart data={trends} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Po kategorijama</Text>
              <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
                <Pressable style={[styles.tabBtn, catTab === "income" && { backgroundColor: colors.income }]} onPress={() => setCatTab("income")}>
                  <Text style={[styles.tabText, { color: catTab === "income" ? "#fff" : colors.mutedForeground }]}>Prihodi</Text>
                </Pressable>
                <Pressable style={[styles.tabBtn, catTab === "expense" && { backgroundColor: colors.expense }]} onPress={() => setCatTab("expense")}>
                  <Text style={[styles.tabText, { color: catTab === "expense" ? "#fff" : colors.mutedForeground }]}>Rashodi</Text>
                </Pressable>
              </View>
              <DonutChart data={monthCatTotals} type={catTab} />
            </View>
          </>
        )}

        {/* ════════════ RANGE MODE ════════════ */}
        {mode === "range" && (
          <>
            {/* Quick shortcuts */}
            <View style={styles.quickRow}>
              {[
                { label: "Danas",     from: todayStr(),        to: todayStr()      },
                { label: "Ova sed.",  from: startOfWeekStr(),  to: todayStr()      },
                { label: "Ovaj mj.", from: startOfMonthStr(), to: todayStr()      },
                { label: "Kvartal",  from: startOfQuarterStr(), to: todayStr()    },
              ].map(q => (
                <Pressable
                  key={q.label}
                  style={[
                    styles.quickBtn,
                    {
                      backgroundColor: fromDate === q.from && toDate === q.to ? colors.primary : colors.card,
                      borderColor:     fromDate === q.from && toDate === q.to ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => applyQuick(q.from, q.to)}
                  testID={`quick-${q.label}`}
                >
                  <Text style={[
                    styles.quickBtnText,
                    { color: fromDate === q.from && toDate === q.to ? "#fff" : colors.foreground },
                  ]}>
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Date range inputs */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Odaberi period</Text>

              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.mutedForeground }]}>OD</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: isValidDate(fromRaw) ? colors.primary : colors.destructive, color: colors.foreground }]}
                    value={fromRaw}
                    onChangeText={handleFromChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground}
                    testID="from-date-input"
                  />
                  {isValidDate(fromRaw) && (
                    <Text style={[styles.dateParsed, { color: colors.mutedForeground }]}>{fmtDisplay(fromRaw)}</Text>
                  )}
                </View>

                <View style={[styles.dateSeparator, { backgroundColor: colors.border }]} />

                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.mutedForeground }]}>DO</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: isValidDate(toRaw) ? colors.primary : colors.destructive, color: colors.foreground }]}
                    value={toRaw}
                    onChangeText={handleToChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground}
                    testID="to-date-input"
                  />
                  {isValidDate(toRaw) && (
                    <Text style={[styles.dateParsed, { color: colors.mutedForeground }]}>{fmtDisplay(toRaw)}</Text>
                  )}
                </View>
              </View>

              {!rangeValid && isValidDate(fromRaw) && isValidDate(toRaw) && fromDate > toDate && (
                <Text style={[styles.dateError, { color: colors.destructive }]}>
                  Datum "od" mora biti prije datuma "do"
                </Text>
              )}
            </View>

            {rangeValid && (
              <>
                {/* Period label */}
                <View style={[styles.periodLabel, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                  <Feather name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.periodLabelText, { color: colors.primary }]}>
                    {fmtDisplay(fromDate)} — {fmtDisplay(toDate)}
                    {" · "}{rangeTxs.length} transakcija
                  </Text>
                </View>

                {/* Summary cards */}
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryCard, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }]}>
                    <Feather name="trending-up" size={15} color={colors.income} />
                    <Text style={[styles.summaryLabel, { color: colors.income }]}>Prihodi</Text>
                    <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatAmount(rangeIncome)}</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
                    <Feather name="trending-down" size={15} color={colors.expense} />
                    <Text style={[styles.summaryLabel, { color: colors.expense }]}>Rashodi</Text>
                    <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatAmount(rangeExpense)}</Text>
                  </View>
                </View>

                {/* Profit / Loss card */}
                <View style={[
                  styles.profitCard,
                  {
                    backgroundColor: isProfit ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    borderColor:     isProfit ? "rgba(34,197,94,0.4)"  : "rgba(239,68,68,0.4)",
                  },
                ]}>
                  <View style={styles.profitLeft}>
                    <View style={[styles.profitIconBg, { backgroundColor: isProfit ? colors.income : colors.expense }]}>
                      <Feather name={isProfit ? "arrow-up" : "arrow-down"} size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={[styles.profitTitle, { color: isProfit ? colors.income : colors.expense }]}>
                        {isProfit ? "PROFIT" : "GUBITAK"}
                      </Text>
                      <Text style={[styles.profitSub, { color: colors.mutedForeground }]}>
                        Prihodi − Rashodi
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.profitAmount, { color: isProfit ? colors.income : colors.expense }]}>
                    {isProfit ? "+" : ""}{formatAmount(rangeNet)}
                  </Text>
                </View>

                {/* Margin row */}
                {rangeIncome > 0 && (
                  <View style={[styles.marginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.marginLabel, { color: colors.mutedForeground }]}>Profitna marža</Text>
                    <Text style={[styles.marginValue, { color: isProfit ? colors.income : colors.expense }]}>
                      {((rangeNet / rangeIncome) * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}

                {/* Category breakdown */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Po kategorijama</Text>
                  <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
                    <Pressable style={[styles.tabBtn, catTabR === "income" && { backgroundColor: colors.income }]} onPress={() => setCatTabR("income")}>
                      <Text style={[styles.tabText, { color: catTabR === "income" ? "#fff" : colors.mutedForeground }]}>Prihodi</Text>
                    </Pressable>
                    <Pressable style={[styles.tabBtn, catTabR === "expense" && { backgroundColor: colors.expense }]} onPress={() => setCatTabR("expense")}>
                      <Text style={[styles.tabText, { color: catTabR === "expense" ? "#fff" : colors.mutedForeground }]}>Rashodi</Text>
                    </Pressable>
                  </View>
                  <DonutChart data={rangeCatTotals} type={catTabR} />
                </View>
              </>
            )}

            {!rangeValid && !(isValidDate(fromRaw) && isValidDate(toRaw)) && (
              <View style={[styles.emptyHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={24} color={colors.mutedForeground} />
                <Text style={[styles.emptyHintText, { color: colors.mutedForeground }]}>
                  Unesite datume u formatu YYYY-MM-DD ili koristite brze izbore iznad
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  title:   { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },

  modeToggle:   { flexDirection: "row", borderRadius: 14, padding: 4 },
  modeBtn:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  modeBtnText:  { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  monthNav:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 10 },
  navArrow:   { padding: 8 },
  monthLabel: { fontSize: 17, fontFamily: "Inter_600SemiBold" },

  summaryRow:    { flexDirection: "row", gap: 10 },
  summaryCard:   { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  summaryLabel:  { fontSize: 12, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },

  netCard:   { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  netLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  netLabel:  { fontSize: 14, fontFamily: "Inter_500Medium" },
  netAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },

  section:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tabRow:       { flexDirection: "row", borderRadius: 10, padding: 3 },
  tabBtn:       { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabText:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  quickBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  dateRow:       { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dateField:     { flex: 1, gap: 4 },
  dateFieldLabel:{ fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  dateInput:     { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dateParsed:    { fontSize: 11, fontFamily: "Inter_400Regular" },
  dateSeparator: { width: 1, height: 40, marginTop: 22 },
  dateError:     { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 4 },

  periodLabel:     { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  periodLabelText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },

  profitCard:   { borderRadius: 16, borderWidth: 1.5, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profitLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  profitIconBg: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  profitTitle:  { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  profitSub:    { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  profitAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },

  marginCard:  { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marginLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  marginValue: { fontSize: 20, fontFamily: "Inter_700Bold" },

  emptyHint:     { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  emptyHintText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
