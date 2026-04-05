import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TransactionType, useFinance } from "@/context/FinanceContext";
import { useI18n } from "@/context/I18nContext";
import TransactionCard from "@/components/TransactionCard";
import AddTransactionModal from "@/components/AddTransactionModal";

type FilterType = "all" | "income" | "expense";

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { transactions } = useFinance();
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  function handleAdd(type: TransactionType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
    setModalVisible(true);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filterLabel: Record<FilterType, string> = {
    all:     t("txn_all"),
    income:  t("txn_income"),
    expense: t("txn_expenses"),
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("txn_title")}</Text>
        <TouchableOpacity
          onPress={() => handleAdd("expense")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          testID="add-transaction-btn"
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              filter === f && {
                backgroundColor:
                  f === "income" ? "rgba(34,197,94,0.15)" : f === "expense" ? "rgba(239,68,68,0.15)" : colors.accent,
                borderColor:
                  f === "income" ? colors.income : f === "expense" ? colors.expense : colors.primary,
              },
              filter !== f && { borderColor: colors.border },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === f
                      ? f === "income" ? colors.income
                      : f === "expense" ? colors.expense
                      : colors.primary
                      : colors.mutedForeground,
                  fontFamily: filter === f ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {filterLabel[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("txn_empty")}</Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleAdd("expense")}
            >
              <Text style={[styles.emptyAddBtnText, { color: colors.primaryForeground }]}>
                {t("txn_addBtn")}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <TransactionCard transaction={item} />}
      />

      <View style={[styles.fab, { bottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.income }]}
          onPress={() => handleAdd("income")}
          testID="fab-add-income"
        >
          <Feather name="trending-up" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.expense }]}
          onPress={() => handleAdd("expense")}
          testID="fab-add-expense"
        >
          <Feather name="trending-down" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        defaultType={modalType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title:          { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn:         { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterRow:      { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterText:     { fontSize: 13 },
  list:           { paddingHorizontal: 16, paddingTop: 10, gap: 2 },
  emptyState:     { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText:      { fontSize: 16, fontFamily: "Inter_400Regular" },
  emptyAddBtn:    { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  emptyAddBtnText:{ fontSize: 14, fontFamily: "Inter_600SemiBold" },
  fab:            { position: "absolute", right: 16, flexDirection: "row", gap: 10 },
  fabBtn:         { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
});
