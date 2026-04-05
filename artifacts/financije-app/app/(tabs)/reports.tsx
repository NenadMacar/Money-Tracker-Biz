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
import { PaymentMethod, Transaction, useFinance } from "@/context/FinanceContext";
import DonutChart from "@/components/DonutChart";
import MiniBarChart from "@/components/MiniBarChart";

const MONTHS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

type Mode    = "monthly" | "range";
type CatTab  = "income"  | "expense";
type PmFilter = "all" | "bank" | "cash";

const PM_OPTIONS: { key: PmFilter; label: string; icon: string }[] = [
  { key: "all",  label: "Sve",          icon: "layers"      },
  { key: "bank", label: "Tekući račun", icon: "credit-card" },
  { key: "cash", label: "Gotovina",     icon: "dollar-sign" },
];

function applyPmFilter(txs: Transaction[], pm: PmFilter) {
  if (pm === "all") return txs;
  return txs.filter(t => (t.paymentMethod ?? "bank") === pm);
}

function calcTotals(txs: Transaction[]) {
  const income  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, net: income - expense };
}

function todayStr()        { return new Date().toISOString().split("T")[0]; }
function startOfWeekStr()  { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d.toISOString().split("T")[0]; }
function startOfMonthStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
function startOfQuarterStr(){ const d = new Date(); const q = Math.floor(d.getMonth() / 3); return `${d.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`; }
function isValidDate(s: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; return !isNaN(new Date(s).getTime()); }
function fmtDisplay(s: string) { if (!isValidDate(s)) return s; return new Date(s).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }); }

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    getCategoryTotals, getCategoryTotalsByRange,
    getTransactionsByMonth, getTransactionsByDateRange,
    getMonthlyTrends, formatAmount, categories,
  } = useFinance();

  const now = new Date();

  const [mode,    setMode]    = useState<Mode>("monthly");
  const [year,    setYear]    = useState(now.getFullYear());
  const [month,   setMonth]   = useState(now.getMonth());
  const [catTab,  setCatTab]  = useState<CatTab>("income");
  const [pmFilter,setPmFilter]= useState<PmFilter>("all");

  const [fromDate, setFromDate] = useState(startOfMonthStr());
  const [toDate,   setToDate]   = useState(todayStr());
  const [fromRaw,  setFromRaw]  = useState(startOfMonthStr());
  const [toRaw,    setToRaw]    = useState(todayStr());
  const [catTabR,  setCatTabR]  = useState<CatTab>("income");

  const trends = getMonthlyTrends();

  // ── Monthly ────────────────────────────────────────────────
  const monthTxsAll = getTransactionsByMonth(year, month);
  const monthTxs    = applyPmFilter(monthTxsAll, pmFilter);
  const { income: monthIncome, expense: monthExpense, net: monthNet } = calcTotals(monthTxs);

  const monthCatTotals = useMemo(() => {
    const txs = monthTxs.filter(t => t.type === catTab);
    const map  = new Map<string, number>();
    txs.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries()).map(([category, amount]) => {
      const cat = categories.find(c => c.name === category);
      return { category, amount, icon: cat?.icon || "circle" };
    }).sort((a, b) => b.amount - a.amount);
  }, [monthTxs, catTab, categories]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  // ── Range ──────────────────────────────────────────────────
  const rangeValid = isValidDate(fromDate) && isValidDate(toDate) && fromDate <= toDate;

  const rangeTxsAll = useMemo(() => {
    if (!rangeValid) return [];
    return getTransactionsByDateRange(fromDate, toDate);
  }, [fromDate, toDate, rangeValid]);

  const rangeTxs = useMemo(() => applyPmFilter(rangeTxsAll, pmFilter), [rangeTxsAll, pmFilter]);
  const { income: rangeIncome, expense: rangeExpense, net: rangeNet } = calcTotals(rangeTxs);
  const isProfit = rangeNet >= 0;

  const rangeCatTotals = useMemo(() => {
    const txs = rangeTxs.filter(t => t.type === catTabR);
    const map  = new Map<string, number>();
    txs.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries()).map(([category, amount]) => {
      const cat = categories.find(c => c.name === category);
      return { category, amount, icon: cat?.icon || "circle" };
    }).sort((a, b) => b.amount - a.amount);
  }, [rangeTxs, catTabR, categories]);

  function applyQuick(from: string, to: string) {
    setFromDate(from); setFromRaw(from);
    setToDate(to);     setToRaw(to);
  }
  function handleFromChange(v: string) { setFromRaw(v); if (isValidDate(v)) setFromDate(v); }
  function handleToChange(v: string)   { setToRaw(v);   if (isValidDate(v)) setToDate(v); }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Payment filter bar ─────────────────────────────────────
  function PmFilterBar() {
    return (
      <View style={[styles.pmBar, { backgroundColor: colors.muted }]}>
        {PM_OPTIONS.map(opt => {
          const active = pmFilter === opt.key;
          const bg = active
            ? opt.key === "bank" ? "#1d4ed8"
            : opt.key === "cash" ? "#854d0e"
            : colors.primary
            : "transparent";
          return (
            <Pressable
              key={opt.key}
              style={[styles.pmBtn, active && { backgroundColor: bg }]}
              onPress={() => setPmFilter(opt.key)}
              testID={`pm-filter-${opt.key}`}
            >
              <Feather name={opt.icon as any} size={12} color={active ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.pmBtnText, { color: active ? "#fff" : colors.mutedForeground }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ── Summary cards ──────────────────────────────────────────
  function SummaryCards({ income, expense }: { income: number; expense: number }) {
    return (
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }]}>
          <Feather name="trending-up" size={15} color={colors.income} />
          <Text style={[styles.summaryLabel, { color: colors.income }]}>Prihodi</Text>
          <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatAmount(income)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
          <Feather name="trending-down" size={15} color={colors.expense} />
          <Text style={[styles.summaryLabel, { color: colors.expense }]}>Rashodi</Text>
          <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatAmount(expense)}</Text>
        </View>
      </View>
    );
  }

  function NetCard({ net, label }: { net: number; label?: string }) {
    const pos = net >= 0;
    return (
      <View style={[styles.netCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.netLeft}>
          <Feather name={pos ? "arrow-up-circle" : "arrow-down-circle"} size={20} color={pos ? colors.income : colors.expense} />
          <Text style={[styles.netLabel, { color: colors.mutedForeground }]}>{label ?? (pos ? "Profit" : "Gubitak")}</Text>
        </View>
        <Text style={[styles.netAmount, { color: pos ? colors.income : colors.expense }]}>
          {pos ? "+" : ""}{formatAmount(net)}
        </Text>
      </View>
    );
  }

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
          <Pressable style={[styles.modeBtn, mode === "monthly" && { backgroundColor: colors.primary }]} onPress={() => setMode("monthly")}>
            <Feather name="calendar" size={14} color={mode === "monthly" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === "monthly" ? "#fff" : colors.mutedForeground }]}>Mesečno</Text>
          </Pressable>
          <Pressable style={[styles.modeBtn, mode === "range" && { backgroundColor: colors.primary }]} onPress={() => setMode("range")}>
            <Feather name="sliders" size={14} color={mode === "range" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === "range" ? "#fff" : colors.mutedForeground }]}>Po periodu</Text>
          </Pressable>
        </View>

        {/* ── Payment Method Filter ── */}
        <PmFilterBar />

        {pmFilter !== "all" && (
          <View style={[styles.pmActiveBanner, {
            backgroundColor: pmFilter === "bank" ? "rgba(29,78,216,0.1)" : "rgba(133,77,14,0.1)",
            borderColor:     pmFilter === "bank" ? "rgba(29,78,216,0.3)" : "rgba(133,77,14,0.3)",
          }]}>
            <Feather
              name={pmFilter === "bank" ? "credit-card" : "dollar-sign"}
              size={13}
              color={pmFilter === "bank" ? "#1d4ed8" : "#854d0e"}
            />
            <Text style={[styles.pmActiveBannerText, { color: pmFilter === "bank" ? "#1d4ed8" : "#854d0e" }]}>
              Prikazani samo: {pmFilter === "bank" ? "Tekući račun" : "Gotovina"}
            </Text>
          </View>
        )}

        {/* ════════════ MONTHLY MODE ════════════ */}
        {mode === "monthly" && (
          <>
            <View style={[styles.monthNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={prevMonth} style={styles.navArrow} testID="prev-month">
                <Feather name="chevron-left" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navArrow} testID="next-month">
                <Feather name="chevron-right" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <SummaryCards income={monthIncome} expense={monthExpense} />
            <NetCard net={monthNet} />

            {pmFilter === "all" && (
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trendovi — zadnjih 6 mj.</Text>
                <MiniBarChart data={trends} />
              </View>
            )}

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
            <View style={styles.quickRow}>
              {[
                { label: "Danas",     from: todayStr(),         to: todayStr()   },
                { label: "Ova sed.",  from: startOfWeekStr(),   to: todayStr()   },
                { label: "Ovaj mj.", from: startOfMonthStr(),  to: todayStr()   },
                { label: "Kvartal",  from: startOfQuarterStr(),to: todayStr()   },
              ].map(q => (
                <Pressable
                  key={q.label}
                  style={[styles.quickBtn, { backgroundColor: fromDate === q.from && toDate === q.to ? colors.primary : colors.card, borderColor: fromDate === q.from && toDate === q.to ? colors.primary : colors.border }]}
                  onPress={() => applyQuick(q.from, q.to)}
                >
                  <Text style={[styles.quickBtnText, { color: fromDate === q.from && toDate === q.to ? "#fff" : colors.foreground }]}>{q.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Odaberi period</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.mutedForeground }]}>OD</Text>
                  <TextInput style={[styles.dateInput, { backgroundColor: colors.background, borderColor: isValidDate(fromRaw) ? colors.primary : colors.destructive, color: colors.foreground }]} value={fromRaw} onChangeText={handleFromChange} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} testID="from-date-input" />
                  {isValidDate(fromRaw) && <Text style={[styles.dateParsed, { color: colors.mutedForeground }]}>{fmtDisplay(fromRaw)}</Text>}
                </View>
                <View style={[styles.dateSeparator, { backgroundColor: colors.border }]} />
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.mutedForeground }]}>DO</Text>
                  <TextInput style={[styles.dateInput, { backgroundColor: colors.background, borderColor: isValidDate(toRaw) ? colors.primary : colors.destructive, color: colors.foreground }]} value={toRaw} onChangeText={handleToChange} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} testID="to-date-input" />
                  {isValidDate(toRaw) && <Text style={[styles.dateParsed, { color: colors.mutedForeground }]}>{fmtDisplay(toRaw)}</Text>}
                </View>
              </View>
              {isValidDate(fromRaw) && isValidDate(toRaw) && fromDate > toDate && (
                <Text style={[styles.dateError, { color: colors.destructive }]}>Datum "od" mora biti prije datuma "do"</Text>
              )}
            </View>

            {rangeValid && (
              <>
                <View style={[styles.periodLabel, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                  <Feather name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.periodLabelText, { color: colors.primary }]}>
                    {fmtDisplay(fromDate)} — {fmtDisplay(toDate)} · {rangeTxs.length} transakcija
                  </Text>
                </View>

                <SummaryCards income={rangeIncome} expense={rangeExpense} />

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
                      <Text style={[styles.profitSub, { color: colors.mutedForeground }]}>Prihodi − Rashodi</Text>
                    </View>
                  </View>
                  <Text style={[styles.profitAmount, { color: isProfit ? colors.income : colors.expense }]}>
                    {isProfit ? "+" : ""}{formatAmount(rangeNet)}
                  </Text>
                </View>

                {rangeIncome > 0 && (
                  <View style={[styles.marginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.marginLabel, { color: colors.mutedForeground }]}>Profitna marža</Text>
                    <Text style={[styles.marginValue, { color: isProfit ? colors.income : colors.expense }]}>
                      {((rangeNet / rangeIncome) * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}

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

  modeToggle:  { flexDirection: "row", borderRadius: 14, padding: 4 },
  modeBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  pmBar:           { flexDirection: "row", borderRadius: 14, padding: 4, gap: 2 },
  pmBtn:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 10 },
  pmBtnText:       { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pmActiveBanner:  { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  pmActiveBannerText: { fontSize: 13, fontFamily: "Inter_500Medium" },

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

  quickRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  quickBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  dateRow:        { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dateField:      { flex: 1, gap: 4 },
  dateFieldLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  dateInput:      { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dateParsed:     { fontSize: 11, fontFamily: "Inter_400Regular" },
  dateSeparator:  { width: 1, height: 40, marginTop: 22 },
  dateError:      { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 4 },

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
});
