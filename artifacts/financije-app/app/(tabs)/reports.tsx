import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getCategoryTotals, getTransactionsByMonth, getMonthlyTrends, formatAmount } = useFinance();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab,   setTab]   = useState<"income" | "expense">("income");

  const totals       = getCategoryTotals(tab, year, month);
  const txs          = getTransactionsByMonth(year, month);
  const incomeTotal  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTotal = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance   = incomeTotal - expenseTotal;
  const trends       = getMonthlyTrends();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
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
            <Feather name="trending-up" size={16} color={colors.income} />
            <Text style={[styles.summaryLabel, { color: colors.income }]}>Prihodi</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatAmount(incomeTotal)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
            <Feather name="trending-down" size={16} color={colors.expense} />
            <Text style={[styles.summaryLabel, { color: colors.expense }]}>Rashodi</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatAmount(expenseTotal)}</Text>
          </View>
        </View>

        <View style={[styles.netCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.netLabel, { color: colors.mutedForeground }]}>Neto za period</Text>
          <Text style={[styles.netAmount, { color: netBalance >= 0 ? colors.income : colors.expense }]}>
            {netBalance >= 0 ? "+" : ""}{formatAmount(netBalance)}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trendovi — zadnjih 6 mj.</Text>
          <MiniBarChart data={trends} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Po kategorijama</Text>
          <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
            <Pressable
              style={[styles.tabBtn, tab === "income" && { backgroundColor: colors.income }]}
              onPress={() => setTab("income")}
            >
              <Text style={[styles.tabText, { color: tab === "income" ? "#fff" : colors.mutedForeground }]}>
                Prihodi
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, tab === "expense" && { backgroundColor: colors.expense }]}
              onPress={() => setTab("expense")}
            >
              <Text style={[styles.tabText, { color: tab === "expense" ? "#fff" : colors.mutedForeground }]}>
                Rashodi
              </Text>
            </Pressable>
          </View>
          <DonutChart data={totals} type={tab} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  content:       { paddingHorizontal: 16, gap: 12 },
  title:         { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  monthNav:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 10 },
  navArrow:      { padding: 8 },
  monthLabel:    { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  summaryRow:    { flexDirection: "row", gap: 10 },
  summaryCard:   { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  summaryLabel:  { fontSize: 12, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  netCard:       { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  netLabel:      { fontSize: 14, fontFamily: "Inter_500Medium" },
  netAmount:     { fontSize: 18, fontFamily: "Inter_700Bold" },
  section:       { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle:  { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tabRow:        { flexDirection: "row", borderRadius: 10, padding: 3 },
  tabBtn:        { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabText:       { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
