import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Transaction, useFinance } from "@/context/FinanceContext";

interface TransactionCardProps {
  transaction: Transaction;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const colors = useColors();
  const { deleteTransaction, categories, formatAmount } = useFinance();
  const isIncome = transaction.type === "income";
  const isBank   = (transaction.paymentMethod ?? "bank") === "bank";

  const cat  = categories.find(c => c.name === transaction.category);
  const icon = (cat?.icon || "circle") as any;

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Obriši transakciju", "Jesi li siguran?", [
      { text: "Odustani", style: "cancel" },
      { text: "Obriši", style: "destructive", onPress: () => deleteTransaction(transaction.id) },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isIncome ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" },
        ]}
      >
        <Feather name={icon} size={18} color={isIncome ? colors.income : colors.expense} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.category, { color: colors.foreground }]} numberOfLines={1}>
          {transaction.category}
        </Text>
        {transaction.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={1}>
            {transaction.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(transaction.date)}
          </Text>
          <View style={[
            styles.paymentBadge,
            {
              backgroundColor: isBank ? "rgba(59,130,246,0.12)" : "rgba(133,77,14,0.12)",
              borderColor:     isBank ? "rgba(59,130,246,0.3)"  : "rgba(133,77,14,0.3)",
            },
          ]}>
            <Feather
              name={isBank ? "credit-card" : "dollar-sign"}
              size={10}
              color={isBank ? "#3b82f6" : "#854d0e"}
            />
            <Text style={[styles.paymentBadgeText, { color: isBank ? "#3b82f6" : "#854d0e" }]}>
              {isBank ? "Račun" : "Gotovina"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
          {isIncome ? "+" : "-"}{formatAmount(transaction.amount)}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} testID="delete-transaction">
          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer:    { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: "transparent" },
  info:             { flex: 1, gap: 2 },
  category:         { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  description:      { fontSize: 13, fontFamily: "Inter_400Regular" },
  metaRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  date:             { fontSize: 12, fontFamily: "Inter_400Regular" },
  paymentBadge:     { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  paymentBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  right:            { alignItems: "flex-end", gap: 6 },
  amount:           { fontSize: 15, fontFamily: "Inter_700Bold" },
  deleteBtn:        { padding: 4 },
});
