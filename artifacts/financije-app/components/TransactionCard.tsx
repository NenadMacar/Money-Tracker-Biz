import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Transaction, useFinance } from "@/context/FinanceContext";
import CurrencyText, { formatCurrency } from "@/components/CurrencyText";

interface TransactionCardProps {
  transaction: Transaction;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const colors = useColors();
  const { deleteTransaction, categories } = useFinance();
  const isIncome = transaction.type === "income";

  const cat = categories.find((c) => c.name === transaction.category);
  const icon = (cat?.icon || "circle") as any;

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Obriši transakciju", "Jesi li siguran?", [
      { text: "Odustani", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: () => deleteTransaction(transaction.id),
      },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isIncome
              ? "rgba(34,197,94,0.12)"
              : "rgba(239,68,68,0.12)",
          },
        ]}
      >
        <Feather
          name={icon}
          size={18}
          color={isIncome ? colors.income : colors.expense}
        />
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
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
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
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  category: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: {
    padding: 4,
  },
});
