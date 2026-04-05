import React from "react";
import { Text, TextStyle } from "react-native";
import { useFinance } from "@/context/FinanceContext";

interface CurrencyTextProps {
  amount: number;
  style?: TextStyle;
  colored?: boolean;
  type?: "income" | "expense" | "balance";
}

const INCOME_COLOR    = "#22c55e";
const EXPENSE_COLOR   = "#ef4444";
const BALANCE_POS     = "#1e40af";
const BALANCE_NEG     = "#ef4444";

export default function CurrencyText({ amount, style, colored = false, type }: CurrencyTextProps) {
  const { formatAmount } = useFinance();

  let color: string | undefined;
  if (colored) {
    if (type === "income")        color = INCOME_COLOR;
    else if (type === "expense")  color = EXPENSE_COLOR;
    else if (type === "balance")  color = amount >= 0 ? BALANCE_POS : BALANCE_NEG;
  }

  return (
    <Text style={[style, color ? { color } : undefined]}>
      {type === "expense" && amount > 0 ? "-" : ""}
      {formatAmount(amount)}
    </Text>
  );
}
