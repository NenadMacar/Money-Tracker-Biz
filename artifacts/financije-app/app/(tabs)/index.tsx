import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import TransactionCard from "@/components/TransactionCard";
import AddTransactionModal from "@/components/AddTransactionModal";
import MiniBarChart from "@/components/MiniBarChart";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getTotalIncome, getTotalExpenses, getBalance, transactions, getMonthlyTrends, formatAmount } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");

  const balance  = getBalance();
  const income   = getTotalIncome();
  const expenses = getTotalExpenses();
  const recentTx = transactions.slice(0, 5);
  const trends   = getMonthlyTrends();

  function openModal(type: "income" | "expense") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
    setModalVisible(true);
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
        <Text style={[styles.greeting,     { color: colors.mutedForeground }]}>Dobrodošli</Text>
        <Text style={[styles.companyLabel, { color: colors.foreground }]}>Poslovne Financije</Text>

        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.balanceLabel}>Ukupni saldo</Text>
          <Text style={[styles.balanceAmount, { color: balance < 0 ? "#fca5a5" : "#ffffff" }]}>
            {formatAmount(balance)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Feather name="trending-up" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.balanceStatLabel}>Prihodi</Text>
              <Text style={styles.balanceStatValue}>{formatAmount(income)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Feather name="trending-down" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.balanceStatLabel}>Rashodi</Text>
              <Text style={styles.balanceStatValue}>{formatAmount(expenses)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: colors.income }]}
            onPress={() => openModal("income")}
            testID="add-income-btn"
          >
            <Feather name="plus" size={18} color={colors.income} />
            <Text style={[styles.actionBtnText, { color: colors.income }]}>Dodaj prihod</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: colors.expense }]}
            onPress={() => openModal("expense")}
            testID="add-expense-btn"
          >
            <Feather name="minus" size={18} color={colors.expense} />
            <Text style={[styles.actionBtnText, { color: colors.expense }]}>Dodaj rashod</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trendovi — zadnjih 6 mj.</Text>
          <MiniBarChart data={trends} />
        </View>

        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nedavne transakcije</Text>
        </View>

        {recentTx.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nema transakcija. Dodajte prvu!
            </Text>
          </View>
        ) : (
          recentTx.map(tx => <TransactionCard key={tx.id} transaction={tx} />)
        )}
      </ScrollView>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        defaultType={modalType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1 },
  content:          { paddingHorizontal: 16, gap: 4 },
  greeting:         { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  companyLabel:     { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 16 },
  balanceCard:      { borderRadius: 20, padding: 22, marginBottom: 14 },
  balanceLabel:     { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  balanceAmount:    { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 18 },
  balanceRow:       { flexDirection: "row", alignItems: "center" },
  balanceStat:      { flex: 1, alignItems: "center", gap: 3 },
  balanceStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  balanceStatValue: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  balanceDivider:   { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  quickActions:     { flexDirection: "row", gap: 10, marginBottom: 14 },
  actionBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  actionBtnText:    { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section:          { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
  sectionTitle:     { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  recentHeader:     { marginTop: 6, marginBottom: 2 },
  emptyState:       { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center", gap: 10, marginTop: 8 },
  emptyText:        { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
